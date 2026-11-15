const DEFAULT_TTL_MS = 15 * 60 * 1000; // 15 minutes
const DEFAULT_TIMEOUT_MS = 10 * 1000; // 10 seconds

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
  storedAt: number;
}

export class TtlCache<T> {
  private store = new Map<string, CacheEntry<T>>();
  private ttlMs: number;

  constructor(ttlMs: number = DEFAULT_TTL_MS) {
    this.ttlMs = ttlMs;
  }

  get(key: string): T | null {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }
    return entry.value;
  }

  set(key: string, value: T): void {
    const now = Date.now();
    this.store.set(key, {
      value,
      storedAt: now,
      expiresAt: now + this.ttlMs,
    });
  }

  getTimestamp(key: string): number | null {
    const entry = this.store.get(key);
    if (!entry || Date.now() > entry.expiresAt) return null;
    return entry.storedAt;
  }

  clear(): void {
    this.store.clear();
  }
}

export async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeoutMs: number = DEFAULT_TIMEOUT_MS
): Promise<Response> {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      ...options,
      signal: options.signal ?? controller.signal,
    });
    return response;
  } catch (err: unknown) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw new Error(`Request timed out after ${Math.round(timeoutMs / 1000)}s`);
    }
    throw err;
  } finally {
    window.clearTimeout(timer);
  }
}
