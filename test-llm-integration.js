/**
 * Test script for LLM integration
 * Run with: node test-llm-integration.js
 */

async function testLLMIntegration() {
  console.log("🧪 Testing LLM Integration...\n");

  // Test 1: Check Ollama availability
  console.log("Test 1: Checking Ollama service...");
  try {
    const healthResponse = await fetch("http://localhost:11434/api/tags");
    if (healthResponse.ok) {
      const data = await healthResponse.json();
      console.log("✅ Ollama is running");
      console.log(`   Models available: ${data.models.map(m => m.name).join(", ")}\n`);
    } else {
      console.log("❌ Ollama is not responding\n");
      return;
    }
  } catch (error) {
    console.log("❌ Cannot connect to Ollama");
    console.log("   Make sure Ollama is running: ollama serve\n");
    return;
  }

  // Test 2: Generate a suggestion
  console.log("Test 2: Generating form field suggestion...");
  try {
    const startTime = Date.now();
    
    const response = await fetch("http://localhost:11434/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "mistral:7b-instruct",
        prompt: `You are a project management assistant. Based on the following context, suggest a brief task description.

Context: Software development task
Previous Fields:
- title: Implement OAuth2 Authentication
- priority: High

Field to suggest: Task Description

Provide only the suggested value, no explanation or extra text. Keep it brief and professional.`,
        stream: false,
        options: {
          temperature: 0.3,
          top_p: 0.9,
          max_tokens: 150,
        },
      }),
    });

    const data = await response.json();
    const endTime = Date.now();
    
    if (data.response) {
      console.log("✅ Suggestion generated successfully");
      console.log(`   Time taken: ${endTime - startTime}ms`);
      console.log(`   Suggestion: "${data.response.trim()}"\n`);
    } else {
      console.log("❌ No response from model\n");
    }
  } catch (error) {
    console.log("❌ Failed to generate suggestion");
    console.error("   Error:", error.message, "\n");
  }

  // Test 3: Performance benchmark
  console.log("Test 3: Running performance benchmark (3 requests)...");
  const times = [];
  
  for (let i = 0; i < 3; i++) {
    try {
      const startTime = Date.now();
      
      await fetch("http://localhost:11434/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "mistral:7b-instruct",
          prompt: "Generate a one-sentence task description for a development task.",
          stream: false,
          options: { temperature: 0.3, max_tokens: 50 },
        }),
      });
      
      const endTime = Date.now();
      times.push(endTime - startTime);
      console.log(`   Request ${i + 1}: ${endTime - startTime}ms`);
    } catch (error) {
      console.log(`   Request ${i + 1}: Failed`);
    }
  }
  
  if (times.length > 0) {
    const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
    console.log(`\n   Average response time: ${avgTime.toFixed(0)}ms`);
    console.log(`   Min: ${Math.min(...times)}ms, Max: ${Math.max(...times)}ms\n`);
  }

  console.log("✨ All tests completed!");
  console.log("\nNext steps:");
  console.log("1. Add VITE_LLM_ENABLED=true to your .env file");
  console.log("2. Start your dev server: npm run dev");
  console.log("3. Try the AI suggestions in your forms!");
}

// Run tests
testLLMIntegration().catch(console.error);
