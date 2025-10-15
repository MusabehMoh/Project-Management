# AI-Powered Form Suggestions

This project includes an AI-powered form suggestion system using **Ollama** and local LLMs running on your RTX 3090.

## 🚀 Quick Start

### 1. Installation

Run the setup script:
```bash
setup-ai.bat
```

Or install manually:
```bash
# Install Ollama
winget install Ollama.Ollama

# Pull the model (Mistral 7B recommended)
ollama pull mistral:7b-instruct

# Test it
ollama run mistral:7b-instruct "Hello!"
```

### 2. Configuration

Add to your `.env` file:
```env
VITE_LLM_ENABLED=true
VITE_LLM_API_URL=http://localhost:11434
VITE_LLM_MODEL=mistral:7b-instruct
```

### 3. Start Ollama Server

```bash
ollama serve
```

## 📖 Usage

### Basic Hook Usage

```tsx
import { useFormSuggestion } from "@/hooks";

function MyFormComponent() {
  const { suggestion, loading, getSuggestion, isLLMAvailable } = useFormSuggestion({
    field: "Task Description",
    context: "Software development task for authentication",
    previousValues: {
      title: "Implement OAuth2",
      priority: "High"
    }
  });

  return (
    <div>
      <Button 
        onPress={getSuggestion} 
        isLoading={loading}
        isDisabled={!isLLMAvailable}
      >
        AI Suggest
      </Button>
      {suggestion && <p>Suggestion: {suggestion}</p>}
    </div>
  );
}
```

### Example Component

See `src/components/AIFormSuggestionExample.tsx` for a complete working example with:
- AI suggestion button
- Apply/Clear suggestion actions
- Error handling
- Loading states
- LLM availability check

## 🎯 Recommended Models

### For RTX 3090 (24GB VRAM)

| Model | Size | Speed | Quality | Best For |
|-------|------|-------|---------|----------|
| **Mistral 7B Instruct** | ~14GB | ⚡⚡⚡ | ⭐⭐⭐⭐ | Form suggestions (recommended) |
| Llama 3.1 8B | ~16GB | ⚡⚡ | ⭐⭐⭐⭐⭐ | Complex descriptions |
| Llama 3.2 3B | ~6GB | ⚡⚡⚡⚡ | ⭐⭐⭐ | Fast autocomplete |
| Phi-3 Medium | ~20GB | ⚡⚡ | ⭐⭐⭐⭐⭐ | High-quality outputs |

### Installation

```bash
# Mistral (recommended)
ollama pull mistral:7b-instruct

# Llama 3.1
ollama pull llama3.1:8b

# Llama 3.2 (faster)
ollama pull llama3.2:3b

# Check installed models
ollama list
```

## 🔧 API Reference

### `llmService`

Located in `src/services/api/llmService.ts`

#### Methods

**`getSuggestion(request)`**
```typescript
interface LLMSuggestionRequest {
  context: string;           // The context for the suggestion
  field: string;             // Field name to generate suggestion for
  previousValues?: Record<string, string>; // Already filled form fields
  maxTokens?: number;        // Maximum response length (default: 150)
}

const result = await llmService.getSuggestion({
  context: "Creating a software development task",
  field: "Task Description",
  previousValues: { title: "OAuth Implementation" }
});
```

**`checkHealth()`**
```typescript
const isAvailable = await llmService.checkHealth();
```

**`getAvailableModels()`**
```typescript
const models = await llmService.getAvailableModels();
// Returns: ["mistral:7b-instruct", "llama3.1:8b", ...]
```

### `useFormSuggestion` Hook

```typescript
interface UseFormSuggestionOptions {
  field: string;                    // Field to generate suggestion for
  context: string;                  // Context information
  previousValues?: Record<string, string>; // Other form field values
  autoSuggest?: boolean;            // Auto-generate on mount
  debounceMs?: number;              // Debounce delay (not yet implemented)
}

interface UseFormSuggestionResult {
  suggestion: string;               // Generated suggestion
  loading: boolean;                 // Loading state
  error: string | null;             // Error message
  isLLMAvailable: boolean;          // LLM service availability
  getSuggestion: () => Promise<void>; // Trigger suggestion generation
  clearSuggestion: () => void;      // Clear current suggestion
  applySuggestion: () => string;    // Get suggestion value
}
```

## 💡 Use Cases

### 1. Task Description Generation
```tsx
const { suggestion, getSuggestion } = useFormSuggestion({
  field: "Task Description",
  context: `Project: ${projectName}, Requirement: ${requirementName}`,
  previousValues: { priority, estimatedHours }
});
```

### 2. Project Summary
```tsx
const { suggestion } = useFormSuggestion({
  field: "Project Summary",
  context: `Project for: ${clientName}, Department: ${department}`,
  autoSuggest: true // Generate immediately
});
```

### 3. Requirement Elaboration
```tsx
const { suggestion } = useFormSuggestion({
  field: "Detailed Requirements",
  context: `Brief: ${briefDescription}, Stakeholders: ${stakeholders}`,
  previousValues: { projectType, deliveryDate }
});
```

## 🎨 Integration with Existing Forms

### Add to `AddAdhocTask` Component

```tsx
// In src/components/AddAdhocTask.tsx
import { useFormSuggestion } from "@/hooks";

// Add AI suggestion for description
const { 
  suggestion: aiDescription, 
  loading: aiLoading,
  getSuggestion,
  isLLMAvailable 
} = useFormSuggestion({
  field: "Task Description",
  context: `Task: ${formData.name}, Type: Adhoc, Priority: ${formData.priority}`,
  previousValues: {
    name: formData.name,
    projectName: selectedProject?.name
  }
});

// Add AI button next to description field
<div className="flex items-center justify-between mb-2">
  <label>Description</label>
  <Button
    size="sm"
    variant="flat"
    startContent={<Sparkles />}
    onPress={getSuggestion}
    isLoading={aiLoading}
    isDisabled={!isLLMAvailable}
  >
    AI Suggest
  </Button>
</div>
```

## 🛠️ Troubleshooting

### LLM Not Available

```bash
# Check if Ollama is running
curl http://localhost:11434/api/tags

# Start Ollama
ollama serve

# Check installed models
ollama list
```

### Slow Responses

1. Use a smaller model: `llama3.2:3b`
2. Reduce `maxTokens` in requests
3. Check GPU usage: Task Manager → Performance → GPU

### Download Failed

```bash
# Try alternative model
ollama pull llama3.2:3b

# Or use direct download
ollama pull mistral:7b-instruct --insecure
```

### Memory Issues

Your RTX 3090 has 24GB VRAM, which is plenty. But if you run into issues:

```bash
# Use quantized models (smaller)
ollama pull mistral:7b-instruct-q4_0  # 4-bit quantization
```

## 📊 Performance

On RTX 3090:
- **Mistral 7B**: ~500ms per suggestion
- **Llama 3.1 8B**: ~700ms per suggestion
- **Llama 3.2 3B**: ~200ms per suggestion

VRAM Usage:
- **Mistral 7B**: ~14GB
- **Llama 3.1 8B**: ~16GB
- **Llama 3.2 3B**: ~6GB

## 🔐 Privacy & Security

- **100% Local**: All processing happens on your machine
- **No Cloud**: No data sent to external servers
- **Offline Capable**: Works without internet (after model download)
- **No API Keys**: No external API costs or limits

## 🚀 Advanced Configuration

### Custom Prompt Templates

Edit `src/services/api/llmService.ts` → `buildPrompt()` method:

```typescript
buildPrompt(request: LLMSuggestionRequest): string {
  return `You are a project management expert.
Task: ${request.context}
Field: ${request.field}
Previous data: ${JSON.stringify(request.previousValues)}

Provide a professional, concise suggestion.`;
}
```

### Adjust Temperature

Lower = more deterministic, Higher = more creative

```typescript
// In llmService.ts
const LLM_CONFIG = {
  temperature: 0.3, // 0.0 = deterministic, 1.0 = creative
};
```

### Multiple Models

```typescript
// Switch models based on field type
const model = field === "description" 
  ? "llama3.1:8b"  // Better quality for descriptions
  : "mistral:7b-instruct"; // Faster for simple fields
```

## 📝 Next Steps

1. ✅ Install and test Ollama with Mistral 7B
2. ✅ Add AI suggestions to your most-used forms
3. 🔄 Collect user feedback on suggestion quality
4. 🎯 Fine-tune prompts for better results
5. 🚀 Explore other models for specific use cases

## 🆘 Support

- **Ollama Docs**: https://ollama.com/docs
- **Model Library**: https://ollama.com/library
- **Discord**: https://discord.gg/ollama

---

**Powered by Ollama + Mistral 7B running locally on your RTX 3090** 🚀
