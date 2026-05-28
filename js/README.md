# SemCache (JavaScript/TypeScript SDK)

A high-performance, tiered semantic caching SDK for JavaScript environments (Node.js, browsers). Generates local embeddings using quantized ONNX runtime under the hood for zero-cost, low-latency prompt comparisons.

## Installation

```bash
npm install semcache
```

## Quick Start

```typescript
import { SemCache, FileStore } from 'semcache';

// Initialize cache with local file storage
const cache = new SemCache({
  store: new FileStore('./.semcache/cache-db.json'),
  fuzzyThreshold: 0.95,      // Jaccard token threshold (0.0 to 1.0)
  semanticThreshold: 0.85    // Cosine similarity threshold (0.0 to 1.0)
});

// Seed an entry (simulate an LLM call of 1500ms)
await cache.set('What is the capital of France?', 'The capital of France is Paris.', {
  latencyMs: 1500,
  tokenUsage: { promptTokens: 7, completionTokens: 7 }
});

// Perform a semantic query (Runs local ONNX embedding, returns match in <30ms)
const match = await cache.get('Tell me the capital city of France');

if (match) {
  const { entry, tier, similarity } = match;
  console.log(`Hit Tier: ${tier} (Similarity: ${similarity.toFixed(4)})`);
  console.log(`Response: ${entry.response}`);
}
```

---

## 📊 Developer Console

The JS SDK comes with a built-in, zero-dependency developer dashboard. It runs a local server that provides real-time telemetry, sandbox queries, and a force-directed vector space graph showing clustered query associations.

```typescript
import { SemCache } from 'semcache';

const cache = new SemCache();

// Start the console server
cache.startDevServer(3000); 
console.log('Dashboard running at http://localhost:3000');
```

---

## Configuration API

The `SemCache` constructor accepts the following options:

| Parameter | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `store` | `CacheStore` | `MemoryStore` | Cache storage adapter (`MemoryStore` or `FileStore`). |
| `fuzzyThreshold` | `number` | `0.95` | Word overlap token matching similarity threshold. |
| `semanticThreshold` | `number` | `0.88` | Cosine similarity threshold for local semantic vector matching. |
| `modelName` | `string` | `'Xenova/all-MiniLM-L6-v2'` | The ONNX embedding model to download and run. |
| `cacheDir` | `string` | `undefined` | Directory path to store downloaded ONNX models. |
| `enableTelemetry` | `boolean` | `true` | Enable tracking of cost and latency metrics. |
