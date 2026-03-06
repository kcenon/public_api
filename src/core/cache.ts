/** Pluggable cache adapter interface. */
export interface CacheAdapter {
  get<T>(key: string): Promise<T | undefined>;
  set<T>(key: string, value: T, ttlSeconds: number): Promise<void>;
  delete(key: string): Promise<boolean>;
  clear(): Promise<void>;
  has(key: string): Promise<boolean>;
  size(): Promise<number>;
}

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

/** In-memory cache adapter with TTL and LRU eviction. */
export class MemoryCacheAdapter implements CacheAdapter {
  private readonly store = new Map<string, CacheEntry<unknown>>();
  private readonly maxEntries: number;

  constructor(maxEntries = 1000) {
    this.maxEntries = maxEntries;
  }

  async get<T>(key: string): Promise<T | undefined> {
    const entry = this.store.get(key);
    if (!entry) return undefined;

    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return undefined;
    }

    // LRU: move to end by re-inserting
    this.store.delete(key);
    this.store.set(key, entry);

    return entry.value as T;
  }

  async set<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
    // Evict expired entries periodically (every set call)
    if (this.store.size >= this.maxEntries) {
      this.evict();
    }

    this.store.set(key, {
      value,
      expiresAt: Date.now() + ttlSeconds * 1000,
    });
  }

  async delete(key: string): Promise<boolean> {
    return this.store.delete(key);
  }

  async clear(): Promise<void> {
    this.store.clear();
  }

  async has(key: string): Promise<boolean> {
    const entry = this.store.get(key);
    if (!entry) return false;

    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return false;
    }

    return true;
  }

  async size(): Promise<number> {
    return this.store.size;
  }

  private evict(): void {
    const now = Date.now();

    // First pass: remove expired entries
    for (const [key, entry] of this.store) {
      if (now > entry.expiresAt) {
        this.store.delete(key);
      }
    }

    // If still over capacity, remove oldest (LRU) entries
    while (this.store.size >= this.maxEntries) {
      const oldestKey = this.store.keys().next().value;
      if (oldestKey !== undefined) {
        this.store.delete(oldestKey);
      } else {
        break;
      }
    }
  }
}

/** Cache statistics. */
export interface CacheStats {
  hits: number;
  misses: number;
  hitRate: number;
  size: number;
}

/** Cache manager with statistics tracking and key generation. */
export class CacheManager {
  private readonly adapter: CacheAdapter;
  private readonly enabled: boolean;
  private readonly defaultTtl: number;
  private hits = 0;
  private misses = 0;

  constructor(
    options: {
      adapter?: CacheAdapter;
      enabled?: boolean;
      defaultTtl?: number;
      maxEntries?: number;
    } = {},
  ) {
    this.enabled = options.enabled ?? true;
    this.defaultTtl = options.defaultTtl ?? 3600;
    this.adapter =
      options.adapter ?? new MemoryCacheAdapter(options.maxEntries ?? 1000);
  }

  async get<T>(key: string): Promise<T | undefined> {
    if (!this.enabled) return undefined;

    const value = await this.adapter.get<T>(key);
    if (value !== undefined) {
      this.hits++;
    } else {
      this.misses++;
    }
    return value;
  }

  async set<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
    if (!this.enabled) return;
    await this.adapter.set(key, value, ttlSeconds ?? this.defaultTtl);
  }

  async delete(key: string): Promise<boolean> {
    return this.adapter.delete(key);
  }

  async deleteByPrefix(_prefix: string): Promise<void> {
    // For adapters that support iteration; memory adapter uses Map
    // This is a best-effort operation
    if (this.adapter instanceof MemoryCacheAdapter) {
      await this.adapter.clear();
    }
  }

  async clear(): Promise<void> {
    await this.adapter.clear();
    this.resetStats();
  }

  async has(key: string): Promise<boolean> {
    if (!this.enabled) return false;
    return this.adapter.has(key);
  }

  async getStats(): Promise<CacheStats> {
    const total = this.hits + this.misses;
    return {
      hits: this.hits,
      misses: this.misses,
      hitRate: total > 0 ? this.hits / total : 0,
      size: await this.adapter.size(),
    };
  }

  resetStats(): void {
    this.hits = 0;
    this.misses = 0;
  }

  /** Generate a deterministic cache key from request parameters. */
  static generateKey(
    adapter: string,
    method: string,
    params: Record<string, unknown>,
  ): string {
    const sortedParams = Object.keys(params)
      .sort()
      .reduce(
        (acc, key) => {
          const value = params[key];
          if (value !== undefined && value !== null) {
            acc[key] = value;
          }
          return acc;
        },
        {} as Record<string, unknown>,
      );

    return `${adapter}:${method}:${JSON.stringify(sortedParams)}`;
  }
}
