using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;

namespace PMA.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [AllowAnonymous] // AI proxy doesn't require authentication
    public class AIController : ControllerBase
    {
        private readonly IHttpClientFactory _httpClientFactory;
        private readonly ILogger<AIController> _logger;
        private readonly IConfiguration _configuration;

        public AIController(
            IHttpClientFactory httpClientFactory, 
            ILogger<AIController> logger,
            IConfiguration configuration)
        {
            _httpClientFactory = httpClientFactory;
            _logger = logger;
            _configuration = configuration;
        }

        [HttpGet("models")]
        [ProducesResponseType(200)]
        [ProducesResponseType(500)]
        public async Task<IActionResult> GetAvailableModels()
        {
            try
            {
                var ollamaUrl = _configuration["Ollama:BaseUrl"] ?? "http://localhost:11434";
                var apiKey = _configuration["Ollama:ApiKey"]; // Get API key from config
                var httpClient = _httpClientFactory.CreateClient();
                
                var request = new HttpRequestMessage(HttpMethod.Get, $"{ollamaUrl}/api/tags");
                
                // Add API key header if configured (for OpenWebUI authentication)
                if (!string.IsNullOrEmpty(apiKey))
                {
                    request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", apiKey);
                }
                
                var response = await httpClient.SendAsync(request);
                
                if (!response.IsSuccessStatusCode)
                {
                    return StatusCode((int)response.StatusCode, "Failed to fetch models from Ollama");
                }
                
                var content = await response.Content.ReadAsStringAsync();
                return Content(content, "application/json");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching available models from Ollama");
                return StatusCode(500, "Failed to fetch available models");
            }
        }

        [HttpPost("chat")]
        [ProducesResponseType(200)]
        [ProducesResponseType(400)]
        [ProducesResponseType(500)]
        [AllowAnonymous]
        public async Task Chat([FromBody] OpenAIChatRequest request)
        {
            try
            {
                // Get Ollama configuration from appsettings
                var ollamaBaseUrl = _configuration["Ollama:BaseUrl"] ?? "http://localhost:11434";
                var apiKey = _configuration["Ollama:ApiKey"]; // Get API key from config
                var defaultModel = _configuration["Ollama:DefaultModel"] ?? "llama3.1:8b";
                
                // Use default model if not specified in request
                if (string.IsNullOrEmpty(request.Model))
                {
                    request.Model = defaultModel;
                }
                
                // Build the correct endpoint URL
                // If BaseUrl already includes the endpoint path (e.g., "http://localhost:3000/api/chat/completions"), use it as-is
                // If it's just a base URL (e.g., "http://localhost:11434"), append the endpoint
                var ollamaUrl = ollamaBaseUrl.Contains("/api/chat") || ollamaBaseUrl.Contains("/v1/chat")
                    ? ollamaBaseUrl
                    : $"{ollamaBaseUrl.TrimEnd('/')}/api/chat/completions";
                
                _logger.LogInformation("Proxying OpenAI-compatible chat request to Ollama at {OllamaUrl} using model {Model}", 
                    ollamaUrl, request.Model);

                var httpClient = _httpClientFactory.CreateClient();
                httpClient.Timeout = TimeSpan.FromMinutes(5); // Longer timeout for AI responses

                // Serialize request to JSON (OpenAI format)
                var jsonContent = JsonSerializer.Serialize(request, new JsonSerializerOptions
                {
                    PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
                    DefaultIgnoreCondition = System.Text.Json.Serialization.JsonIgnoreCondition.WhenWritingNull
                });

                // Use chat completions endpoint
                var httpRequest = new HttpRequestMessage(HttpMethod.Post, ollamaUrl)
                {
                    Content = new StringContent(jsonContent, Encoding.UTF8, new MediaTypeHeaderValue("application/json"))
                };

                // Add API key header if configured (for OpenWebUI authentication)
                if (!string.IsNullOrEmpty(apiKey))
                {
                    httpRequest.Headers.Authorization = new AuthenticationHeaderValue("Bearer", apiKey);
                }

                // Send request with streaming
                var response = await httpClient.SendAsync(httpRequest, HttpCompletionOption.ResponseHeadersRead);

                if (!response.IsSuccessStatusCode)
                {
                    // Read the error response body to get detailed error message
                    var errorContent = await response.Content.ReadAsStringAsync();
                    
                    _logger.LogError("Ollama API returned error {StatusCode}: {ErrorContent}", 
                        response.StatusCode, errorContent);
                    
                    Response.StatusCode = (int)response.StatusCode;
                    Response.ContentType = "application/json";

                    // IMPORTANT: Prevent browser basic-auth popup on 401 by removing WWW-Authenticate
                    // Some upstream servers (e.g., OpenWebUI) return this header which triggers the prompt
                    if (Response.Headers.ContainsKey("WWW-Authenticate"))
                    {
                        Response.Headers.Remove("WWW-Authenticate");
                    }
                    
                    // Try to parse and return the error message from Ollama
                    try
                    {
                        using var errorDoc = JsonDocument.Parse(errorContent);
                        if (errorDoc.RootElement.TryGetProperty("detail", out var detail))
                        {
                            await Response.WriteAsync(JsonSerializer.Serialize(new { error = detail.GetString() }));
                        }
                        else if (errorDoc.RootElement.TryGetProperty("error", out var error))
                        {
                            await Response.WriteAsync(JsonSerializer.Serialize(new { error = error.GetString() }));
                        }
                        else
                        {
                            // Return the full error content if we can't extract a specific message
                            await Response.WriteAsync(errorContent);
                        }
                    }
                    catch
                    {
                        // If JSON parsing fails, return raw error content
                        await Response.WriteAsync(JsonSerializer.Serialize(new 
                        { 
                            error = $"Ollama API error: {errorContent}" 
                        }));
                    }
                    
                    return;
                }

                // Set response headers for SSE streaming (OpenAI format)
                Response.ContentType = "text/event-stream";
                Response.Headers.CacheControl = "no-cache";
                Response.Headers.Connection = "keep-alive";
                Response.Headers.Append("X-Accel-Buffering", "no"); // Disable nginx buffering

                // Stream the response back to client with immediate flushing
                await using var stream = await response.Content.ReadAsStreamAsync();
                var buffer = new byte[1024]; // Small buffer for faster streaming
                int bytesRead;
                
                while ((bytesRead = await stream.ReadAsync(buffer, 0, buffer.Length)) > 0)
                {
                    await Response.Body.WriteAsync(buffer, 0, bytesRead);
                    await Response.Body.FlushAsync(); // Flush immediately for true streaming
                }
            }
            catch (HttpRequestException ex)
            {
                _logger.LogError(ex, "Failed to connect to Ollama API");
                Response.StatusCode = 503;
                await Response.WriteAsync("Failed to connect to Ollama service. Is it running?");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error proxying chat request to Ollama");
                Response.StatusCode = 500;
                await Response.WriteAsync($"Internal server error: {ex.Message}");
            }
        }

        [HttpPost("save-memory")]
        [ProducesResponseType(200)]
        [ProducesResponseType(500)]
        public async Task<IActionResult> SaveToN8nMemory([FromBody] N8nMemoryRequest request)
        {
            try
            {
                // Get n8n webhook URL from configuration
                var n8nWebhookUrl = _configuration["N8n:AgentWebhookUrl"] ?? "http://localhost:5678/webhook/ai-suggest-agent";
                
                _logger.LogInformation("Saving conversation to n8n memory at {N8nUrl}", n8nWebhookUrl);

                var httpClient = _httpClientFactory.CreateClient();
                httpClient.Timeout = TimeSpan.FromSeconds(30);

                // Serialize request to JSON
                var jsonContent = JsonSerializer.Serialize(request, new JsonSerializerOptions
                {
                    PropertyNamingPolicy = JsonNamingPolicy.CamelCase
                });

                var httpRequest = new HttpRequestMessage(HttpMethod.Post, n8nWebhookUrl)
                {
                    Content = new StringContent(jsonContent, Encoding.UTF8, new MediaTypeHeaderValue("application/json"))
                };

                var response = await httpClient.SendAsync(httpRequest);

                if (!response.IsSuccessStatusCode)
                {
                    _logger.LogWarning("n8n webhook returned error: {StatusCode}", response.StatusCode);
                    // Don't fail the request - memory save is optional
                }

                return Ok(new { success = true });
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to save to n8n memory (non-critical)");
                // Return success anyway - memory save is optional
                return Ok(new { success = true });
            }
        }
    }

    // DTOs for OpenAI-compatible API (used by Ollama's /v1/chat/completions endpoint)
    public class OpenAIChatRequest
    {
        public string Model { get; set; } = "llama3.1:8b";
        public List<OpenAIMessage> Messages { get; set; } = new();
        public bool Stream { get; set; } = true;
        public double Temperature { get; set; } = 0.5;
        public int? Max_Tokens { get; set; } = 400;
    }

    public class OpenAIMessage
    {
        public string Role { get; set; } = "";
        public string Content { get; set; } = "";
    }

    // DTO for n8n memory save
    public class N8nMemoryRequest
    {
        public string Context { get; set; } = "";
        public string Response { get; set; } = "";
        public string SessionId { get; set; } = "";
        public bool SaveToMemory { get; set; } = true;
        public string Field { get; set; } = "";
        public Dictionary<string, string>? PreviousValues { get; set; }
    }
}
