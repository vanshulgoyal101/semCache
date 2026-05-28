import { describe, it, expect, beforeAll } from 'vitest';
import { SemCache } from '../src/core.js';
import { MemoryStore } from '../src/store.js';

describe('SemCache Core Tests', () => {
  let cache: SemCache;

  beforeAll(async () => {
    cache = new SemCache({
      store: new MemoryStore(),
      fuzzyThreshold: 0.9,
      semanticThreshold: 0.70, // lowered to capture wider variations
    });

    // Populate initial items
    await cache.set('What is the weather today?', 'The weather is sunny with a high of 75 degrees.', {
      latencyMs: 1200,
      tokenUsage: { promptTokens: 6, completionTokens: 12 },
    });
  });

  it('should return null on a cache miss', async () => {
    const result = await cache.get('How many planets are in the solar system?');
    expect(result).toBeNull();
  });

  it('should hit Tier 1 (Exact Match) for identical normalized query', async () => {
    const result = await cache.get('What is the weather today?');
    expect(result).not.toBeNull();
    expect(result!.tier).toBe(1);
    expect(result!.similarity).toBe(1.0);
    expect(result!.entry.response).toBe('The weather is sunny with a high of 75 degrees.');
  });

  it('should hit Tier 1 (Exact Match) even with different casing and punctuation', async () => {
    const result = await cache.get('  WHAT is the weather today...   ');
    expect(result).not.toBeNull();
    expect(result!.tier).toBe(1);
    expect(result!.similarity).toBe(1.0);
  });

  it('should hit Tier 2 (Fuzzy Match) for minor spelling corrections or additions', async () => {
    // Jaccard similarity is very high here
    const result = await cache.get('What is the weather today ?');
    expect(result).not.toBeNull();
    expect(result!.tier).toBe(2);
  });

  it('should hit Tier 3 (Semantic Match) for different phrasing but same meaning', async () => {
    const result = await cache.get('how is the weather looking today');
    expect(result).not.toBeNull();
    console.log('Semantic match similarity score:', result!.similarity);
    expect(result!.tier).toBe(3);
    expect(result!.similarity).toBeGreaterThanOrEqual(0.70);
  });
});

