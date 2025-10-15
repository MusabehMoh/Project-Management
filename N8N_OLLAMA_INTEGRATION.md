# n8n + Ollama Integration Guide

Complete guide for using n8n workflow automation with Ollama LLM for AI-powered form suggestions.

## 🏗️ Architecture

```
Frontend (React) 
    ↓ HTTP POST
n8n Workflow (localhost:5678)
    ↓ Processes request
    ↓ Calls Ollama API
Ollama (localhost:11434) + Mistral 7B
    ↓ Generates suggestion
    ↓ Returns to n8n
n8n Workflow
    ↓ Formats response
Frontend (receives suggestion)
```

## ✅ Prerequisites

- ✅ Docker installed and running
- ✅ n8n running on http://localhost:5678
- ✅ Ollama installed with Mistral 7B model
- ✅ Ollama running on http://localhost:11434

## 📦 Step 1: Import n8n Workflow

### Option A: Import via n8n UI

1. Open n8n: http://localhost:5678
2. Click **"Workflows"** in left sidebar
3. Click **"Add workflow"** button
4. Click the **"..." menu** (top right)
5. Select **"Import from File"**
6. Choose: `n8n-workflows/ai-form-suggestion-workflow.json`
7. Click **"Save"** (top right)

### Option B: Import via API

```bash
curl -X POST http://localhost:5678/api/v1/workflows \
  -H "Content-Type: application/json" \
  -d @n8n-workflows/ai-form-suggestion-workflow.json
```

## 🔧 Step 2: Configure Docker Network

Since n8n runs in Docker, it needs to access Ollama on your host machine.

### Update Ollama API URL in Workflow

In the **"Call Ollama API"** node, the URL should be:
```
http://host.docker.internal:11434/api/generate
```

This special hostname allows Docker containers to reach your host machine.

### Verify Docker can reach Ollama

```powershell
# Test from inside n8n container
docker exec -it <n8n-container-id> curl http://host.docker.internal:11434/api/tags
```

## 🎯 Step 3: Activate Workflow

1. In n8n UI, open your imported workflow
2. Click **"Active"** toggle (top right) to turn it **ON**
3. The webhook will now be listening at: `http://localhost:5678/webhook/ai-suggest`

## 🧪 Step 4: Test the Integration

### Test 1: Direct Webhook Test

```powershell
# PowerShell test
$body = @{
    context = "Software development task"
    field = "Task Description"
    previousValues = @{
        title = "Implement OAuth2"
        priority = "High"
    }
    maxTokens = 150
} | ConvertTo-Json

Invoke-WebRequest -Uri "http://localhost:5678/webhook/ai-suggest" `
    -Method POST `
    -ContentType "application/json" `
    -Body $body
```

Expected response:
```json
{
  "success": true,
  "data": {
    "suggestion": "Develop and integrate OAuth2 authentication...",
    "confidence": 0.85,
    "metadata": {
      "field": "Task Description",
      "model": "mistral:7b-instruct"
    }
  },
  "message": "Suggestion generated successfully"
}
```

### Test 2: From Your React App

The `llmService` will automatically use n8n when `VITE_LLM_USE_N8N=true`:

```typescript
import { llmService } from "@/services/api/llmService";

const result = await llmService.getSuggestion({
  context: "Creating a development task",
  field: "Task Description",
  previousValues: { title: "OAuth Implementation" }
});

console.log(result.data?.suggestion);
```

## 📊 Workflow Nodes Explained

### 1. **Webhook Trigger**
- Listens for POST requests at `/webhook/ai-suggest`
- Receives: `{ context, field, previousValues, maxTokens }`

### 2. **Build Ollama Prompt**
- JavaScript code node
- Constructs the prompt from request data
- Prepares Ollama API request structure

### 3. **Call Ollama API**
- HTTP Request node
- POSTs to `http://host.docker.internal:11434/api/generate`
- Sends prompt to Mistral 7B model

### 4. **Format Response**
- JavaScript code node
- Extracts suggestion from Ollama response
- Formats into standardized API response

### 5. **Send Response**
- Respond to Webhook node
- Returns formatted JSON to frontend

### 6. **Error Handler** (if something fails)
- Catches errors from any node
- Returns error response to frontend

## 🎨 Customizing the Workflow

### Change the Prompt Template

Edit the **"Build Ollama Prompt"** node:

```javascript
// Customize this part:
let prompt = `You are a project management expert.
Based on: ${context}
Previous data: ${JSON.stringify(previousValues)}
Suggest a value for: ${field}

Format: Brief, professional, actionable.`;
```

### Add Pre-processing

Add a node before "Build Ollama Prompt" to:
- Validate input
- Fetch additional context from your database
- Apply business rules

### Add Post-processing

Add a node after "Format Response" to:
- Save suggestions to database
- Send notifications
- Log analytics

### Add Multiple LLM Calls

Create a switch node to:
- Use different models for different field types
- Combine multiple suggestions
- A/B test different prompts

## 🔄 Advanced Workflows

### Example: Multi-Step Suggestion

```
Webhook
  ↓
Fetch Project Details (HTTP Request to your API)
  ↓
Build Context (Code)
  ↓
Call Ollama
  ↓
Validate Suggestion (Code - check length, profanity, etc.)
  ↓
Save to Cache (Redis/Database)
  ↓
Send Response
```

### Example: Fallback to Cloud LLM

```
Webhook
  ↓
Try Ollama (with error handling)
  ↓ (if fails)
Fallback to OpenAI/Anthropic
  ↓
Send Response
```

## 🐛 Troubleshooting

### Webhook Returns 404

**Problem**: Workflow is not active
**Solution**: 
1. Open workflow in n8n
2. Toggle "Active" to ON (top right)

### "Cannot connect to Ollama"

**Problem**: Docker can't reach host machine
**Solution**: 
1. Check Ollama is running: `ollama list`
2. Use `host.docker.internal` instead of `localhost`
3. Windows: Ensure Docker Desktop is running

### Slow Response Times

**Problem**: First request is slow (~2-3 seconds)
**Solution**: 
1. Normal - Ollama loads model on first request
2. Keep Ollama running in background
3. Add a "warm-up" call when n8n starts

### Timeout Errors

**Problem**: Request takes >15 seconds
**Solution**:
1. Increase timeout in "Call Ollama API" node
2. Use a smaller/faster model (llama3.2:3b)
3. Reduce `maxTokens` parameter

### Response Format Errors

**Problem**: Frontend can't parse response
**Solution**:
1. Check "Format Response" node returns correct structure
2. Verify `success`, `data`, `message` fields exist
3. Test webhook directly with curl/Postman

## 📈 Monitoring & Debugging

### View Execution History

1. In n8n, go to **"Executions"** tab
2. See all webhook calls, success/failure status
3. Click any execution to see data flow through nodes

### Add Logging

Add a **"Function"** node anywhere:

```javascript
console.log("Debug:", $input.item.json);
return $input.item;
```

### Performance Metrics

The response includes timing data:

```json
{
  "metadata": {
    "totalDuration": 594000000,  // nanoseconds
    "evalCount": 89               // tokens generated
  }
}
```

## 🚀 Production Considerations

### Security

1. **Add Authentication**: Use HTTP Request node with API key
2. **Rate Limiting**: Add rate limiting nodes
3. **Input Validation**: Validate/sanitize all inputs

### Reliability

1. **Add Retry Logic**: Retry failed Ollama calls
2. **Circuit Breaker**: Disable after multiple failures
3. **Health Checks**: Ping Ollama before calling

### Scaling

1. **Queue System**: Add Redis queue for high traffic
2. **Multiple Workers**: Run multiple n8n instances
3. **Load Balancer**: Distribute across Ollama instances

## 🔀 Switching Between n8n and Direct Ollama

### Use n8n (Recommended for Production)

```env
VITE_LLM_USE_N8N=true
VITE_LLM_N8N_WEBHOOK_URL=http://localhost:5678/webhook/ai-suggest
```

**Pros:**
- Visual workflow editor
- Easy to add logging, validation, preprocessing
- Non-developers can modify workflows
- Built-in retry and error handling
- Execution history and debugging

**Cons:**
- Extra ~50-100ms latency
- One more service to manage

### Use Direct Ollama (For Development)

```env
VITE_LLM_USE_N8N=false
VITE_LLM_API_URL=http://localhost:11434
```

**Pros:**
- Slightly faster (~50ms less)
- Simpler architecture
- Easier to debug in dev

**Cons:**
- No visual workflow
- Harder to modify prompts
- No execution history

## 📝 n8n Workflow Enhancements

### Add Slack Notifications

1. Add **Slack** node after "Format Response"
2. Send notification when suggestion is generated
3. Include suggestion text and field name

### Save to Database

1. Add **PostgreSQL/MySQL** node
2. Save all suggestions for analytics
3. Track which fields get the most AI help

### A/B Testing

1. Add **Switch** node after webhook
2. Route 50% to Model A, 50% to Model B
3. Compare results and user satisfaction

### Caching

1. Add **Redis** node before Ollama call
2. Check if same request was made recently
3. Return cached suggestion (much faster)

## 🎓 Learning Resources

- **n8n Documentation**: https://docs.n8n.io
- **Workflow Templates**: https://n8n.io/workflows
- **Community Forum**: https://community.n8n.io
- **Ollama Integration**: https://docs.n8n.io/integrations/builtin/app-nodes/n8n-nodes-base.ollama/

## 🆘 Need Help?

1. Check n8n execution logs
2. Test Ollama directly: `ollama run mistral:7b-instruct "test"`
3. Verify webhook URL is correct and workflow is active
4. Check Docker can reach host: `ping host.docker.internal`

---

**Your n8n + Ollama integration is ready!** 🎉

The workflow gives you flexibility to modify prompts, add preprocessing, and scale as needed.
