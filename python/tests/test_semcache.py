import pytest
from semcache import SemCache, MemoryStore

def test_semcache_tiers():
    cache = SemCache(
        store=MemoryStore(),
        fuzzy_threshold=0.9,
        semantic_threshold=0.75
    )

    # Populate cache
    cache.set(
        query="What is the weather today?",
        response="The weather is sunny with a high of 75 degrees.",
        latency_ms=1200
    )

    # Test cache miss
    assert cache.get("How many planets are in the solar system?") is None

    # Test Tier 1 (Exact Match)
    res1 = cache.get("What is the weather today?")
    assert res1 is not None
    entry, tier, similarity = res1
    assert tier == 1
    assert similarity == 1.0
    assert entry.response == "The weather is sunny with a high of 75 degrees."

    # Test Tier 1 with different casing
    res1_case = cache.get("   WHAT is the weather today ?  ")
    assert res1_case is not None
    assert res1_case[1] == 1

    # Test Tier 2 (Fuzzy Jaccard Match)
    res2 = cache.get("What is the weather today ?")
    assert res2 is not None
    assert res2[1] == 2

    # Test Tier 3 (Semantic Match)
    res3 = cache.get("how is the weather looking today")
    assert res3 is not None
    entry, tier, similarity = res3
    assert tier == 3
    assert similarity >= 0.75
