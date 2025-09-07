// Simple API cache to prevent duplicate requests
class ApiCache {
  private cache: Map<string, { data: any; timestamp: number }> = new Map();
  private pendingRequests: Map<string, Promise<any>> = new Map();
  private readonly CACHE_DURATION = 30000; // 30 seconds

  generateKey(endpoint: string, params?: any): string {
    const baseKey = endpoint;

    if (params) {
      const paramString = JSON.stringify(params);

      return `${baseKey}_${paramString}`;
    }

    return baseKey;
  }

  isValid(timestamp: number): boolean {
    return Date.now() - timestamp < this.CACHE_DURATION;
  }

  get(key: string): any | null {
    const cached = this.cache.get(key);

    if (cached && this.isValid(cached.timestamp)) {
      console.log(`📦 Cache HIT for key: ${key}`);

      return cached.data;
    }

    return null;
  }

  set(key: string, data: any): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });
    console.log(`💾 Cache SET for key: ${key}`);
  }

  async getOrFetch<T>(
    key: string,
    fetchFunction: () => Promise<T>,
  ): Promise<T> {
    // Check cache first
    const cached = this.get(key);

    if (cached) {
      return cached;
    }

    // Check if request is already pending
    const pending = this.pendingRequests.get(key);

    if (pending) {
      console.log(`⏳ Request PENDING for key: ${key}`);

      return pending;
    }

    // Make new request
    console.log(`🌐 Cache MISS - Making API call for key: ${key}`);
    const requestPromise = fetchFunction()
      .then((result) => {
        this.set(key, result);
        this.pendingRequests.delete(key);

        return result;
      })
      .catch((error) => {
        this.pendingRequests.delete(key);
        throw error;
      });

    this.pendingRequests.set(key, requestPromise);

    return requestPromise;
  }

  invalidate(pattern?: string): void {
    if (pattern) {
      // Invalidate keys matching pattern
      for (const key of this.cache.keys()) {
        if (key.includes(pattern)) {
          this.cache.delete(key);
          console.log(
            `🗑️ Cache INVALIDATED for pattern: ${pattern}, key: ${key}`,
          );
        }
      }
    } else {
      // Clear all cache
      this.cache.clear();
      this.pendingRequests.clear();
      console.log(`🗑️ Cache CLEARED completely`);
    }
  }

  clear(): void {
    this.invalidate();
  }
}

export const apiCache = new ApiCache();
