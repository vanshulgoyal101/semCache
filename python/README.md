# SemCache (Python SDK)

Zero-cost, low-latency tiered semantic caching SDK for LLMs running local embeddings.

## Installation

```bash
pip install semc
```

## Quick Start

```python
from semcache import SemCache, FileStore

# Initialize cache with local file storage
cache = SemCache(
    store=FileStore(".semcache/db.json"),
    fuzzy_threshold=0.95,
    semantic_threshold=0.85
)

# Set an entry (simulate LLM response time of 1500ms)
cache.set(
    query="What is the capital of France?",
    response="The capital of France is Paris.",
    latency_ms=1500,
    token_usage={"prompt_tokens": 7, "completion_tokens": 7}
)

# Query semantic matching (instant hit in ~20ms, $0 API cost)
result = cache.get("tell me the capital city of France")
if result:
    entry, tier, similarity = result
    print(f"Hit Tier: {tier} (Similarity: {similarity:.4f})")
    print(f"Response: {entry.response}")
```
