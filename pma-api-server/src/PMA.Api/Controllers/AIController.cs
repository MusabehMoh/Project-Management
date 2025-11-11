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
                var httpClient = _httpClientFactory.CreateClient();
                
                var response = await httpClient.GetAsync($"{ollamaUrl}/api/tags");
                
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
        public async Task Chat([FromBody] OllamaChatRequest request)
        {
            try
            {
                // Get Ollama configuration from appsettings
                var ollamaUrl = _configuration["Ollama:BaseUrl"] ?? "http://localhost:11434";
                var defaultModel = _configuration["Ollama:DefaultModel"] ?? "llama3.1:8b";
                
                // Use default model if not specified in request
                if (string.IsNullOrEmpty(request.Model))
                {
                    request.Model = defaultModel;
                }
                
                _logger.LogInformation("Proxying chat request to Ollama at {OllamaUrl} using model {Model}", 
                    ollamaUrl, request.Model);

                var httpClient = _httpClientFactory.CreateClient();
                httpClient.Timeout = TimeSpan.FromMinutes(5); // Longer timeout for AI responses

                // Serialize request to JSON
                var jsonContent = JsonSerializer.Serialize(request, new JsonSerializerOptions
                {
                    PropertyNamingPolicy = JsonNamingPolicy.CamelCase
                });

                var httpRequest = new HttpRequestMessage(HttpMethod.Post, $"{ollamaUrl}/api/chat")
                {
                    Content = new StringContent(jsonContent, Encoding.UTF8, "application/json")
                };

                // Send request with streaming
                var response = await httpClient.SendAsync(httpRequest, HttpCompletionOption.ResponseHeadersRead);

                if (!response.IsSuccessStatusCode)
                {
                    _logger.LogError("Ollama API returned error: {StatusCode}", response.StatusCode);
                    Response.StatusCode = (int)response.StatusCode;
                    await Response.WriteAsync($"Ollama API error: {response.StatusCode}");
                    return;
                }

                // Set response headers for streaming
                Response.ContentType = "application/x-ndjson";
                Response.Headers.CacheControl = "no-cache";
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

    // DTOs for Ollama API
    public class OllamaChatRequest
    {
        public string Model { get; set; } = "llama3.1:8b";
        public List<OllamaMessage> Messages { get; set; } = new();
        public bool Stream { get; set; } = true;
        public OllamaOptions? Options { get; set; }
    }

    public class OllamaMessage
    {
        public string Role { get; set; } = "";
        public string Content { get; set; } = "";
    }

    public class OllamaOptions
    {
        public double Temperature { get; set; } = 0.5;
        public int Num_Predict { get; set; } = 400;
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
