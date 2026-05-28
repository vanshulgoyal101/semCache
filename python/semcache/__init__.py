from .core import SemCache
from .store import CacheEntry, CacheStore, MemoryStore, FileStore
from .embeddings import EmbeddingEngine, cosine_similarity

__version__ = "1.0.0"
__all__ = [
    "SemCache",
    "CacheEntry",
    "CacheStore",
    "MemoryStore",
    "FileStore",
    "EmbeddingEngine",
    "cosine_similarity"
]
