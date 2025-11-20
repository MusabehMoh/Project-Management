# Quick Start: AI Diagram Generation

## 1️⃣ Import n8n Workflow (5 minutes)

1. Open n8n: `http://localhost:5678`
2. Click "Workflows" → "Import from File"
3. Select: `n8n-workflows/ai-diagram-generation-workflow.json`
4. Click "Save" then "Activate"

## 2️⃣ Test Webhook (30 seconds)

```bash
curl -X POST http://localhost:5678/webhook/ai-diagram \
  -H "Content-Type: application/json" \
  -d '{"diagramType":"flowchart","prompt":"Create a simple login flow","context":"User authentication"}'
```

Expected response:
```json
{
  "success": true,
  "data": {
    "suggestion": "flowchart TD\n    A[Login Page] --> B{Valid?}\n    ...",
    "confidence": 0.9
  }
}
```

## 3️⃣ Test in Frontend (1 minute)

1. Make sure frontend is running: `npm run dev`
2. Go to any project's requirements page
3. Click "Generate Diagram" button (Network icon in header)
4. Fill in:
   - **Diagram Type**: Flowchart
   - **Prompt**: "Create a requirement approval workflow"
5. Click "Generate"
6. See diagram in Preview tab!

## ✅ Success Checklist

- [ ] n8n workflow shows as "Active"
- [ ] Webhook test returns valid JSON
- [ ] Frontend shows diagram generator modal
- [ ] Can select different diagram types
- [ ] Generated diagram renders in preview
- [ ] Can copy code and download SVG

## 🆘 Troubleshooting

### Problem: Webhook returns 404
**Fix**: Workflow not activated - go to n8n and click "Activate"

### Problem: "Request timeout"
**Fix**: Ollama may be slow - wait 20 seconds or check GPU usage

### Problem: Invalid Mermaid syntax
**Fix**: Click "Generate" again (AI is non-deterministic)

### Problem: No diagram appears
**Fix**: Check browser console for errors - may need to restart frontend

## 📚 More Info

- **Full Setup Guide**: `docs/AI_DIAGRAM_SETUP.md`
- **Implementation Details**: `docs/DIAGRAM_IMPLEMENTATION_SUMMARY.md`
- **Mermaid Integration**: `docs/MERMAID_INTEGRATION.md`

## 🎉 You're Done!

The system is ready. You now have:
- ✅ Dedicated AI workflow for diagrams
- ✅ 8 diagram types supported
- ✅ Bilingual (English/Arabic)
- ✅ Optimized prompts with examples
- ✅ Clean Mermaid code output
- ✅ Export to SVG capability

**Enjoy creating diagrams with AI!** 🚀
