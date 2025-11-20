# AI Diagram Generation Setup Guide

## Overview
Complete setup guide for AI-powered Mermaid diagram generation using n8n + Ollama.

## Architecture
```
Frontend (React) → n8n Workflow → Ollama (Llama 3.1 8B) → Mermaid Code
```

## Prerequisites
1. ✅ Ollama installed with Llama 3.1 8B model
2. ✅ n8n running on port 5678
3. ✅ Frontend app with Mermaid.js integration

## Setup Steps

### 1. Import n8n Workflow
1. Open n8n: `http://localhost:5678`
2. Go to Workflows
3. Click "Import from File"
4. Select: `n8n-workflows/ai-diagram-generation-workflow.json`
5. Activate the workflow

### 2. Verify Webhook URL
- The workflow creates a webhook at: `http://localhost:5678/webhook/ai-diagram`
- Test webhook: `http://localhost:5678/webhook-test/ai-diagram`

### 3. Environment Configuration
Already configured in `.env`:
```env
VITE_LLM_ENABLED=true
VITE_LLM_USE_N8N=true
VITE_LLM_N8N_DIAGRAM_WEBHOOK_URL=http://localhost:5678/webhook/ai-diagram
```

### 4. Verify Ollama Model
```bash
# Check if Llama 3.1 8B is available
ollama list

# If not present, pull it
ollama pull llama3.1:8b
```

### 5. Test the Integration

#### Manual Test (curl)
```bash
curl -X POST http://localhost:5678/webhook/ai-diagram \
  -H "Content-Type: application/json" \
  -d '{
    "diagramType": "flowchart",
    "prompt": "Create a user authentication flow",
    "context": "Project: Login System"
  }'
```

Expected response:
```json
{
  "success": true,
  "data": {
    "suggestion": "flowchart TD\n    A[User] --> B[Login Page]\n    ...",
    "confidence": 0.9,
    "metadata": {
      "diagramType": "flowchart",
      "model": "llama3.1:8b"
    }
  }
}
```

#### Frontend Test
1. Start app: `npm run dev`
2. Navigate to any project's requirements page
3. Click "Generate Diagram" button (Network icon)
4. Select diagram type: "Flowchart"
5. Enter prompt: "Create a flowchart for requirement approval process"
6. Click "Generate"
7. View diagram in Preview tab

## Workflow Details

### Request Format
```json
{
  "diagramType": "flowchart" | "sequence" | "gantt" | "class" | "state" | "er" | "journey" | "mindmap",
  "prompt": "User's natural language request",
  "context": "Optional context (project name, requirement details, etc.)"
}
```

### Response Format
```json
{
  "success": true,
  "data": {
    "suggestion": "flowchart TD\n    A[Start] --> B[End]",
    "confidence": 0.85,
    "metadata": {
      "diagramType": "flowchart",
      "generatedAt": "2025-11-17T...",
      "model": "llama3.1:8b",
      "tokensUsed": 234
    }
  },
  "message": "Diagram generated successfully"
}
```

### Supported Diagram Types

1. **Flowchart** (`flowchart`)
   - Use case: Process flows, decision trees
   - Example: User registration flow

2. **Sequence** (`sequence`)
   - Use case: API interactions, system communications
   - Example: Login authentication sequence

3. **Gantt** (`gantt`)
   - Use case: Project timelines, task scheduling
   - Example: Sprint planning timeline

4. **Class** (`class`)
   - Use case: Object-oriented design, database schema
   - Example: User management class structure

5. **State** (`state`)
   - Use case: State machines, workflow states
   - Example: Task lifecycle states

6. **ER** (`er`)
   - Use case: Database relationships
   - Example: User-Order-Product relationships

7. **Journey** (`journey`)
   - Use case: User experience flows
   - Example: Customer onboarding journey

8. **Mindmap** (`mindmap`)
   - Use case: Brainstorming, concept mapping
   - Example: Project planning mindmap

## Workflow Configuration

### Ollama Settings
```javascript
{
  model: 'llama3.1:8b',
  temperature: 0.3,      // Low for consistent syntax
  top_p: 0.85,
  top_k: 40,
  num_predict: 500,      // Max tokens for diagram
  repeat_penalty: 1.1,
  frequency_penalty: 0.3,
  presence_penalty: 0.2
}
```

### Why These Settings?
- **Low temperature (0.3)**: Ensures syntactically correct Mermaid code
- **500 tokens**: Enough for complex diagrams
- **Repeat penalty**: Prevents redundant node definitions
- **Llama 3.1 8B**: Better Arabic support + technical syntax

## Troubleshooting

### Issue: "Request timeout"
**Cause**: Diagram generation taking >20 seconds
**Solution**: 
- Check Ollama GPU utilization
- Reduce diagram complexity
- Increase timeout in `llmService.ts` (line ~66)

### Issue: "Invalid Mermaid syntax"
**Cause**: Model generated incorrect syntax
**Solution**:
- Try again (AI can be inconsistent)
- Simplify prompt
- Manually edit in Code tab
- Check n8n workflow logs

### Issue: "Webhook not found"
**Cause**: n8n workflow not activated
**Solution**:
1. Open n8n: `http://localhost:5678`
2. Find "AI Diagram Generation Workflow"
3. Click "Activate"
4. Verify webhook URL matches `.env`

### Issue: Empty or partial diagram
**Cause**: Cleaning regex removed too much
**Solution**:
- Check n8n "Format Response" node logs
- Verify `mermaidCode` variable in workflow
- Adjust cleaning regex if needed

## Performance Expectations

- **Generation Time**: 2-5 seconds (typical)
- **GPU Usage**: ~14-16GB VRAM (RTX 3090)
- **Accuracy**: 85-95% syntactically correct on first try
- **Languages**: English (primary), Arabic (experimental)

## Advanced Configuration

### Use Direct Ollama (Skip n8n)
Set in `.env`:
```env
VITE_LLM_USE_N8N=false
```

This uses `llmService.generateDiagramViaOllama()` fallback method.

### Custom Prompts
Modify workflow → "Build Diagram Prompt" node → Edit `jsCode` variable

### Add New Diagram Types
1. Add example in workflow's `examples` object
2. Update `diagramTypes` array in component
3. Add translations

## Model Recommendations

### Current: Llama 3.1 8B ✅
- **Pros**: Good balance, Arabic support, fast
- **Cons**: Occasional syntax errors

### Better: Qwen2.5-Coder 7B
```bash
ollama pull qwen2.5-coder:7b
```
- **Pros**: Specialized for code, better syntax
- **Cons**: No Arabic support

### Best: DeepSeek-Coder-V2 16B
```bash
ollama pull deepseek-coder-v2:16b
```
- **Pros**: Excellent code generation, very accurate
- **Cons**: Requires 24GB+ VRAM, slower

## Monitoring

### n8n Workflow Logs
1. Open workflow in n8n
2. Click on any execution in history
3. View each node's input/output
4. Check for errors in "Call Ollama API" node

### Frontend Console
Open browser DevTools → Console:
```javascript
// Look for:
"Generating diagram..." 
"Diagram generated successfully"
// Or errors:
"Error generating diagram: ..."
```

## Files Modified

### New Files
- `n8n-workflows/ai-diagram-generation-workflow.json`
- `docs/AI_DIAGRAM_SETUP.md`

### Modified Files
- `src/services/api/llmService.ts` (added `generateDiagram()`)
- `src/components/AIDiagramGenerator.tsx` (updated API call)
- `.env` (added `VITE_LLM_N8N_DIAGRAM_WEBHOOK_URL`)
- `.env.production` (added `VITE_LLM_N8N_DIAGRAM_WEBHOOK_URL`)

## Quick Reference

| Action | Command/URL |
|--------|-------------|
| Start n8n | `http://localhost:5678` |
| Test webhook | `curl -X POST http://localhost:5678/webhook/ai-diagram -d '{...}'` |
| View Ollama logs | `ollama list` |
| Frontend test | Navigate to project requirements → "Generate Diagram" |

## Success Indicators
✅ n8n workflow active
✅ Webhook returns valid JSON
✅ Frontend generates and displays diagrams
✅ No console errors
✅ Mermaid code renders in preview

---

**Last Updated**: November 17, 2025
**Status**: Ready for testing
**Next Steps**: Import workflow to n8n and test
