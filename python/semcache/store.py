import os
import json
import time
from typing import Dict, List, Any, Optional

class CacheEntry:
    def __init__(
        self,
        id: str,
        query: str,
        normalized_query: str,
        response: Any,
        embedding: Optional[List[float]] = None,
        metadata: Optional[Dict[str, Any]] = None,
        created_at: Optional[float] = None,
        last_accessed: Optional[float] = None,
        access_count: int = 0
    ):
        self.id = id
        self.query = query
        self.normalized_query = normalized_query
        self.response = response
        self.embedding = embedding
        self.metadata = metadata or {}
        self.created_at = created_at or time.time()
        self.last_accessed = last_accessed or time.time()
        self.access_count = access_count

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "query": self.query,
            "normalized_query": self.normalized_query,
            "response": self.response,
            "embedding": self.embedding,
            "metadata": self.metadata,
            "created_at": self.created_at,
            "last_accessed": self.last_accessed,
            "access_count": self.access_count
        }

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "CacheEntry":
        return cls(
            id=data["id"],
            query=data["query"],
            normalized_query=data["normalized_query"],
            response=data["response"],
            embedding=data.get("embedding"),
            metadata=data.get("metadata"),
            created_at=data.get("created_at"),
            last_accessed=data.get("last_accessed"),
            access_count=data.get("access_count", 0)
        )

class CacheStore:
    def get(self, entry_id: str) -> Optional[CacheEntry]:
        raise NotImplementedError

    def get_all(self) -> List[CacheEntry]:
        raise NotImplementedError

    def set(self, entry: CacheEntry) -> None:
        raise NotImplementedError

    def delete(self, entry_id: str) -> None:
        raise NotImplementedError

    def clear(self) -> None:
        raise NotImplementedError

class MemoryStore(CacheStore):
    def __init__(self):
        self.entries: Dict[str, CacheEntry] = {}

    def get(self, entry_id: str) -> Optional[CacheEntry]:
        return self.entries.get(entry_id)

    def get_all(self) -> List[CacheEntry]:
        return list(self.entries.values())

    def set(self, entry: CacheEntry) -> None:
        self.entries[entry.id] = entry

    def delete(self, entry_id: str) -> None:
        self.entries.pop(entry_id, None)

    def clear(self) -> None:
        self.entries.clear()

class FileStore(CacheStore):
    def __init__(self, file_path: str):
        self.file_path = os.path.abspath(file_path)
        self.entries: Dict[str, CacheEntry] = {}
        self.is_loaded = False

    def _ensure_loaded(self):
        if self.is_loaded:
            return
        if os.path.exists(self.file_path):
            try:
                with open(self.file_path, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    for item in data:
                        entry = CacheEntry.from_dict(item)
                        self.entries[entry.id] = entry
            except Exception as e:
                print(f"[SemCache] Warning: failed to load file cache: {e}. Starting fresh.")
        self.is_loaded = True

    def _save(self):
        os.makedirs(os.path.dirname(self.file_path), exist_ok=True)
        try:
            data = [entry.to_dict() for entry in self.entries.values()]
            with open(self.file_path, "w", encoding="utf-8") as f:
                json.dump(data, f, indent=2, ensure_ascii=False)
        except Exception as e:
            print(f"[SemCache] Error: failed to save cache file: {e}")

    def get(self, entry_id: str) -> Optional[CacheEntry]:
        self._ensure_loaded()
        entry = self.entries.get(entry_id)
        if entry:
            entry.last_accessed = time.time()
            entry.access_count += 1
            self._save()
            return entry
        return None

    def get_all(self) -> List[CacheEntry]:
        self._ensure_loaded()
        return list(self.entries.values())

    def set(self, entry: CacheEntry) -> None:
        self._ensure_loaded()
        self.entries[entry.id] = entry
        self._save()

    def delete(self, entry_id: str) -> None:
        self._ensure_loaded()
        if entry_id in self.entries:
            del self.entries[entry_id]
            self._save()

    def clear(self) -> None:
        self._ensure_loaded()
        self.entries.clear()
        self._save()
