import re
import hashlib
import time
from typing import Dict, List, Any, Optional, Tuple
import numpy as np

from .embeddings import EmbeddingEngine, cosine_similarity
from .store import CacheEntry, CacheStore, MemoryStore

class SemCache:
    def __init__(
        self,
        store: Optional[CacheStore] = None,
        fuzzy_threshold: float = 0.95,
        semantic_threshold: float = 0.88,
        model_name: str = "all-MiniLM-L6-v2",
        enable_telemetry: bool = True
    ):
        self.store = store or MemoryStore()
        self.fuzzy_threshold = fuzzy_threshold
        self.semantic_threshold = semantic_threshold
        self.enable_telemetry = enable_telemetry
        self.embedding_engine = EmbeddingEngine(model_name=model_name)

        self.stats = {
            "total_lookups": 0,
            "tier1_hits": 0,
            "tier2_hits": 0,
            "tier3_hits": 0,
            "misses": 0,
            "total_latency_saved_ms": 0.0,
            "estimated_cost_saved_usd": 0.0
        }

    def _normalize_query(self, text: str) -> str:
        text = text.lower().strip()
        # Remove punctuation
        text = re.sub(r'[.,\/#!$%\^&\*;:{}=\-_`~()?]', '', text)
        # Normalize whitespace
        return re.sub(r'\s+', ' ', text)

    def _calculate_jaccard_similarity(self, str1: str, str2: str) -> float:
        words1 = set(w for w in str1.split() if w)
        words2 = set(w for w in str2.split() if w)
        if not words1 or not words2:
            return 0.0
        return len(words1.intersection(words2)) / len(words1.union(words2))

    def _generate_id(self, query: str) -> str:
        norm = self._normalize_query(query)
        return hashlib.sha256(norm.encode("utf-8")).hexdigest()

    def get(
        self,
        query: str,
        skip_semantic: bool = False
    ) -> Optional[Tuple[CacheEntry, int, float]]:
        """
        Look up a query in the cache.
        Returns: Tuple of (CacheEntry, tier_number, similarity_score) or None if cache miss.
        """
        start_time = time.time()
        norm_query = self._normalize_query(query)
        self.stats["total_lookups"] += 1

        entries = self.store.get_all()
        if not entries:
            self.stats["misses"] += 1
            return None

        # --- Tier 1: Exact Match ---
        exact_match = next((e for e in entries if e.normalized_query == norm_query), None)
        if exact_match:
            self._record_hit(1, exact_match, start_time)
            return exact_match, 1, 1.0

        # --- Tier 2: Fuzzy Jaccard Match ---
        best_fuzzy_entry = None
        max_fuzzy_sim = 0.0

        for entry in entries:
            sim = self._calculate_jaccard_similarity(norm_query, entry.normalized_query)
            if sim > max_fuzzy_sim:
                max_fuzzy_sim = sim
                best_fuzzy_entry = entry

        if best_fuzzy_entry and max_fuzzy_sim >= self.fuzzy_threshold:
            self._record_hit(2, best_fuzzy_entry, start_time)
            return best_fuzzy_entry, 2, max_fuzzy_sim

        # --- Tier 3: Local Semantic Match ---
        if skip_semantic:
            self.stats["misses"] += 1
            return None

        try:
            query_emb = self.embedding_engine.get_embedding(query)
            best_semantic_entry = None
            max_semantic_sim = -1.0

            for entry in entries:
                if entry.embedding is None:
                    continue
                sim = cosine_similarity(query_emb, np.array(entry.embedding))
                if sim > max_semantic_sim:
                    max_semantic_sim = sim
                    best_semantic_entry = entry

            if best_semantic_entry and max_semantic_sim >= self.semantic_threshold:
                self._record_hit(3, best_semantic_entry, start_time)
                return best_semantic_entry, 3, max_semantic_sim

        except Exception as e:
            print(f"[SemCache] Local semantic matching error: {e}")

        self.stats["misses"] += 1
        return None

    def set(
        self,
        query: str,
        response: Any,
        latency_ms: Optional[float] = None,
        token_usage: Optional[Dict[str, int]] = None,
        cost_saved_usd: Optional[float] = None,
        tags: Optional[List[str]] = None
    ) -> None:
        """
        Store a new query and response in the cache.
        """
        entry_id = self._generate_id(query)
        norm_query = self._normalize_query(query)

        embedding = None
        try:
            emb = self.embedding_engine.get_embedding(query)
            embedding = emb.tolist()
        except Exception as e:
            print(f"[SemCache] Failed to generate embedding for storage: {e}")

        meta = {
            "latency_ms": latency_ms,
            "token_usage": token_usage,
            "cost_saved_usd": cost_saved_usd or self._estimate_cost(token_usage),
            "tags": tags or []
        }

        entry = CacheEntry(
            id=entry_id,
            query=query,
            normalized_query=norm_query,
            response=response,
            embedding=embedding,
            metadata=meta
        )

        self.store.set(entry)

    def _estimate_cost(self, token_usage: Optional[Dict[str, int]]) -> float:
        if not token_usage:
            return 0.002
        prompt = token_usage.get("prompt_tokens", 0)
        completion = token_usage.get("completion_tokens", 0)
        return (prompt * 0.0000015) + (completion * 0.000002)

    def _record_hit(self, tier: int, entry: CacheEntry, start_time: float):
        if not self.enable_telemetry:
            return

        if tier == 1:
            self.stats["tier1_hits"] += 1
        elif tier == 2:
            self.stats["tier2_hits"] += 1
        elif tier == 3:
            self.stats["tier3_hits"] += 1

        lookup_latency_ms = (time.time() - start_time) * 1000
        original_latency = entry.metadata.get("latency_ms") or 1500.0
        self.stats["total_latency_saved_ms"] += max(0.0, original_latency - lookup_latency_ms)

        cost_saved = entry.metadata.get("cost_saved_usd") or 0.002
        self.stats["estimated_cost_saved_usd"] += cost_saved

    def get_telemetry(self) -> Dict[str, Any]:
        return dict(self.stats)

    def reset_telemetry(self) -> None:
        self.stats = {
            "total_lookups": 0,
            "tier1_hits": 0,
            "tier2_hits": 0,
            "tier3_hits": 0,
            "misses": 0,
            "total_latency_saved_ms": 0.0,
            "estimated_cost_saved_usd": 0.0
        }

    def clear(self) -> None:
        self.store.clear()
