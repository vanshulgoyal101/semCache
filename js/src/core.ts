import { EmbeddingEngine, cosineSimilarity } from './embeddings.js';
import { CacheEntry, CacheStore, MemoryStore } from './store.js';
import { DevDashboardServer } from './server.js';
import * as crypto from 'crypto';

export interface SemCacheConfig {
  store?: CacheStore;
  fuzzyThreshold?: number; // Jaccard similarity threshold (0.0 to 1.0)
  semanticThreshold?: number; // Cosine similarity threshold (0.0 to 1.0)
  modelName?: string;
  cacheDir?: string;
  enableTelemetry?: boolean;
}

export interface TelemetryStats {
  totalLookups: number;
  tier1Hits: number; // Exact matches
  tier2Hits: number; // Fuzzy matches
  tier3Hits: number; // Semantic matches
  misses: number;
  totalLatencySavedMs: number;
  estimatedCostSavedUsd: number;
}

export class SemCache {
  private store: CacheStore;
  private fuzzyThreshold: number;
  private semanticThreshold: number;
  private embeddingEngine: EmbeddingEngine;
  private enableTelemetry: boolean;
  private dashboardServer: DevDashboardServer | null = null;


  // Real-time telemetry stats
  private stats: TelemetryStats = {
    totalLookups: 0,
    tier1Hits: 0,
    tier2Hits: 0,
    tier3Hits: 0,
    misses: 0,
    totalLatencySavedMs: 0,
    estimatedCostSavedUsd: 0,
  };

  constructor(config: SemCacheConfig = {}) {
    this.store = config.store || new MemoryStore();
    this.fuzzyThreshold = config.fuzzyThreshold ?? 0.95;
    this.semanticThreshold = config.semanticThreshold ?? 0.70;
    this.enableTelemetry = config.enableTelemetry ?? true;
    this.embeddingEngine = new EmbeddingEngine({
      modelName: config.modelName,
      cacheDir: config.cacheDir,
    });
  }

  /**
   * Normalize input text by trimming, converting to lowercase, and removing punctuation.
   */
  private normalizeQuery(text: string): string {
    return text
      .toLowerCase()
      .trim()
      .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?]/g, '')
      .replace(/\s+/g, ' ');
  }

  /**
   * Calculate Jaccard similarity between two strings using word tokens.
   */
  private calculateJaccardSimilarity(str1: string, str2: string): number {
    const words1 = new Set(str1.split(' ').filter(Boolean));
    const words2 = new Set(str2.split(' ').filter(Boolean));

    if (words1.size === 0 || words2.size === 0) return 0;

    const intersection = new Set([...words1].filter((w) => words2.has(w)));
    const union = new Set([...words1, ...words2]);

    return intersection.size / union.size;
  }

  /**
   * Generate an ID for a cache entry based on query content
   */
  private generateId(query: string): string {
    return crypto.createHash('sha256').update(this.normalizeQuery(query)).digest('hex');
  }

  /**
   * Perform cache lookup using tiered matching strategies.
   */
  public async get<T = any>(
    query: string,
    options?: {
      skipSemantic?: boolean;
    }
  ): Promise<{ entry: CacheEntry<T>; tier: 1 | 2 | 3; similarity: number } | null> {
    const startTime = Date.now();
    const normQuery = this.normalizeQuery(query);
    this.stats.totalLookups++;

    const entries = await this.store.getAll();
    if (entries.length === 0) {
      this.stats.misses++;
      return null;
    }

    // --- Tier 1: Exact Match (0ms, 0 cost) ---
    const exactMatch = entries.find((e) => e.normalizedQuery === normQuery);
    if (exactMatch) {
      this.recordHit(1, exactMatch, startTime);
      return { entry: exactMatch, tier: 1, similarity: 1.0 };
    }

    // --- Tier 2: Fuzzy Keyword Match (<1ms, 0 cost) ---
    let bestFuzzyEntry: CacheEntry | null = null;
    let maxFuzzySimilarity = 0;

    for (const entry of entries) {
      const sim = this.calculateJaccardSimilarity(normQuery, entry.normalizedQuery);
      if (sim > maxFuzzySimilarity) {
        maxFuzzySimilarity = sim;
        bestFuzzyEntry = entry;
      }
    }

    if (bestFuzzyEntry && maxFuzzySimilarity >= this.fuzzyThreshold) {
      this.recordHit(2, bestFuzzyEntry, startTime);
      return { entry: bestFuzzyEntry, tier: 2, similarity: maxFuzzySimilarity };
    }

    // --- Tier 3: Local Semantic Match (15-40ms, 0 cost) ---
    if (options?.skipSemantic) {
      this.stats.misses++;
      return null;
    }

    try {
      const queryEmbedding = await this.embeddingEngine.getEmbedding(query);
      let bestSemanticEntry: CacheEntry | null = null;
      let maxSemanticSimilarity = -1;

      for (const entry of entries) {
        if (!entry.embedding) continue;
        const sim = cosineSimilarity(queryEmbedding, entry.embedding);
        if (sim > maxSemanticSimilarity) {
          maxSemanticSimilarity = sim;
          bestSemanticEntry = entry;
        }
      }

      if (bestSemanticEntry && maxSemanticSimilarity >= this.semanticThreshold) {
        this.recordHit(3, bestSemanticEntry, startTime);
        return { entry: bestSemanticEntry, tier: 3, similarity: maxSemanticSimilarity };
      }
    } catch (err) {
      console.warn(`[SemCache] Local semantic matching failed: ${(err as Error).message}`);
    }

    this.stats.misses++;
    return null;
  }

  /**
   * Add a new item to the cache. Generates local embedding in the background/sync.
   */
  public async set<T = any>(
    query: string,
    response: T,
    metadata?: {
      latencyMs?: number;
      tokenUsage?: { promptTokens: number; completionTokens: number };
      costSavedUsd?: number;
      tags?: string[];
    }
  ): Promise<void> {
    const id = this.generateId(query);
    const normQuery = this.normalizeQuery(query);

    let embedding: number[] | undefined;
    try {
      embedding = await this.embeddingEngine.getEmbedding(query);
    } catch (err) {
      console.warn(`[SemCache] Failed to generate embedding for storage: ${(err as Error).message}`);
    }

    const entry: CacheEntry<T> = {
      id,
      query,
      normalizedQuery: normQuery,
      embedding,
      response,
      metadata: {
        latencyMs: metadata?.latencyMs,
        tokenUsage: metadata?.tokenUsage,
        costSavedUsd: metadata?.costSavedUsd || this.estimateCost(metadata?.tokenUsage),
        tags: metadata?.tags || [],
      },
      createdAt: Date.now(),
      lastAccessed: Date.now(),
      accessCount: 0,
    };

    await this.store.set(entry);
  }

  /**
   * Helper to estimate cost of LLM query based on token count
   */
  private estimateCost(tokenUsage?: { promptTokens: number; completionTokens: number }): number {
    if (!tokenUsage) return 0.002; // Average fallback cost ($0.002)
    // Rough average: $0.0015 / 1k input, $0.002 / 1k output
    return (tokenUsage.promptTokens * 0.0000015) + (tokenUsage.completionTokens * 0.000002);
  }

  /**
   * Record telemetry update
   */
  private recordHit(tier: 1 | 2 | 3, entry: CacheEntry, startTime: number) {
    if (!this.enableTelemetry) return;

    if (tier === 1) this.stats.tier1Hits++;
    else if (tier === 2) this.stats.tier2Hits++;
    else if (tier === 3) this.stats.tier3Hits++;

    const lookupLatency = Date.now() - startTime;
    const originalLatency = entry.metadata?.latencyMs || 1500; // default 1.5s fallback
    this.stats.totalLatencySavedMs += Math.max(0, originalLatency - lookupLatency);

    const costSaved = entry.metadata?.costSavedUsd || 0.002;
    this.stats.estimatedCostSavedUsd += costSaved;
  }

  /**
   * Get current telemetry stats
   */
  public getTelemetry(): TelemetryStats {
    return { ...this.stats };
  }

  /**
   * Clear all telemetry stats
   */
  public resetTelemetry(): void {
    this.stats = {
      totalLookups: 0,
      tier1Hits: 0,
      tier2Hits: 0,
      tier3Hits: 0,
      misses: 0,
      totalLatencySavedMs: 0,
      estimatedCostSavedUsd: 0,
    };
  }

  /**
   * Clear all cache entries
   */
  public async clear(): Promise<void> {
    await this.store.clear();
  }

  /**
   * Start the developer dashboard local server
   */
  public startDevServer(port: number = 3000): void {
    if (!this.dashboardServer) {
      this.dashboardServer = new DevDashboardServer(this);
    }
    this.dashboardServer.start(port);
  }

  /**
   * Stop the developer dashboard local server
   */
  public stopDevServer(): void {
    if (this.dashboardServer) {
      this.dashboardServer.stop();
      this.dashboardServer = null;
    }
  }
}

