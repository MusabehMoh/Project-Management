/**
 * Conversation History Service
 * Manages conversation history for AI form suggestions
 * Stores in localStorage for persistence across sessions
 */

export interface ConversationMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: number;
}

export interface ConversationHistory {
  contextId: string; // e.g., "requirement-123" or "task-456"
  messages: ConversationMessage[];
  createdAt: number;
  updatedAt: number;
}

const STORAGE_KEY = "pma_ai_conversation_history";
const MAX_MESSAGES_PER_CONTEXT = 10; // Keep last 10 exchanges
const MAX_HISTORY_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

class ConversationHistoryService {
  /**
   * Get all conversation histories from localStorage
   */
  private getAllHistories(): Record<string, ConversationHistory> {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return {};
      
      const histories: Record<string, ConversationHistory> = JSON.parse(stored);
      
      // Clean up old histories
      const now = Date.now();
      const cleaned: Record<string, ConversationHistory> = {};
      
      for (const [contextId, history] of Object.entries(histories)) {
        if (now - history.updatedAt < MAX_HISTORY_AGE_MS) {
          cleaned[contextId] = history;
        }
      }
      
      // Save cleaned histories if anything was removed
      if (Object.keys(cleaned).length !== Object.keys(histories).length) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(cleaned));
      }
      
      return cleaned;
    } catch (error) {
      console.error("Error loading conversation histories:", error);
      return {};
    }
  }

  /**
   * Save all conversation histories to localStorage
   */
  private saveAllHistories(histories: Record<string, ConversationHistory>): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(histories));
    } catch (error) {
      console.error("Error saving conversation histories:", error);
    }
  }

  /**
   * Get conversation history for a specific context
   */
  getHistory(contextId: string): ConversationHistory | null {
    const histories = this.getAllHistories();
    return histories[contextId] || null;
  }

  /**
   * Get messages array for a specific context (for API calls)
   */
  getMessages(contextId: string): ConversationMessage[] {
    const history = this.getHistory(contextId);
    return history?.messages || [];
  }

  /**
   * Add a user message to the conversation
   */
  addUserMessage(contextId: string, content: string): void {
    const histories = this.getAllHistories();
    const now = Date.now();
    
    if (!histories[contextId]) {
      histories[contextId] = {
        contextId,
        messages: [],
        createdAt: now,
        updatedAt: now,
      };
    }
    
    histories[contextId].messages.push({
      role: "user",
      content,
      timestamp: now,
    });
    
    histories[contextId].updatedAt = now;
    
    // Trim messages if exceeding max
    if (histories[contextId].messages.length > MAX_MESSAGES_PER_CONTEXT * 2) {
      // Keep last N exchanges (user + assistant pairs)
      histories[contextId].messages = histories[contextId].messages.slice(
        -MAX_MESSAGES_PER_CONTEXT * 2
      );
    }
    
    this.saveAllHistories(histories);
  }

  /**
   * Add an assistant message to the conversation
   */
  addAssistantMessage(contextId: string, content: string): void {
    const histories = this.getAllHistories();
    const now = Date.now();
    
    if (!histories[contextId]) {
      // Create history if it doesn't exist (shouldn't happen in normal flow)
      histories[contextId] = {
        contextId,
        messages: [],
        createdAt: now,
        updatedAt: now,
      };
    }
    
    histories[contextId].messages.push({
      role: "assistant",
      content,
      timestamp: now,
    });
    
    histories[contextId].updatedAt = now;
    
    this.saveAllHistories(histories);
  }

  /**
   * Clear conversation history for a specific context
   */
  clearHistory(contextId: string): void {
    const histories = this.getAllHistories();
    delete histories[contextId];
    this.saveAllHistories(histories);
  }

  /**
   * Clear all conversation histories
   */
  clearAllHistories(): void {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error("Error clearing conversation histories:", error);
    }
  }

  /**
   * Format conversation history for Ollama prompt
   * Returns a formatted string to include in the system prompt
   */
  formatHistoryForPrompt(contextId: string): string {
    const messages = this.getMessages(contextId);
    
    if (messages.length === 0) {
      return "";
    }
    
    const formatted = messages
      .map((msg) => {
        const role = msg.role === "user" ? "User" : "Assistant";
        return `${role}: ${msg.content}`;
      })
      .join("\n\n");
    
    return `\n\nPrevious Conversation:\n${formatted}\n\n`;
  }

  /**
   * Get conversation count for a context
   */
  getMessageCount(contextId: string): number {
    return this.getMessages(contextId).length;
  }

  /**
   * Check if context has history
   */
  hasHistory(contextId: string): boolean {
    return this.getMessageCount(contextId) > 0;
  }
}

// Export singleton instance
export const conversationHistoryService = new ConversationHistoryService();
