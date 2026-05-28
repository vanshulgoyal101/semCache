import numpy as np
from typing import List

class EmbeddingEngine:
    def __init__(self, model_name: str = "all-MiniLM-L6-v2"):
        self.model_name = model_name
        self._model = None

    @property
    def model(self):
        if self._model is None:
            # Lazy load sentence-transformers
            from sentence_transformers import SentenceTransformer
            self._model = SentenceTransformer(self.model_name)
        return self._model

    def get_embedding(self, text: str) -> np.ndarray:
        embedding = self.model.encode(text, convert_to_numpy=True, normalize_embeddings=True)
        return embedding

def cosine_similarity(vec_a: np.ndarray, vec_b: np.ndarray) -> float:
    # Since embeddings are pre-normalized, their cosine similarity is just the dot product
    return float(np.dot(vec_a, vec_b))
