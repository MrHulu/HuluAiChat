"""Embedding service for RAG.

使用 OpenAI text-embedding-3-small 生成文本嵌入。
支持批量处理和缓存。
"""
import logging
import hashlib
from typing import List, Optional, Dict
from dataclasses import dataclass

from openai import AsyncOpenAI, APIError, RateLimitError

from core.config import settings

logger = logging.getLogger(__name__)

# Embedding dimensions for different models
EMBEDDING_DIMENSIONS = {
    "text-embedding-3-small": 1536,
    "text-embedding-3-large": 3072,
    "text-embedding-ada-002": 1536,
}


@dataclass
class EmbeddingResult:
    """Result of embedding operation."""
    success: bool
    embedding: Optional[List[float]] = None
    error: Optional[str] = None


class EmbeddingService:
    """Service for generating text embeddings.

    使用 OpenAI API 生成文本嵌入向量。
    支持缓存以避免重复计算。
    """

    DEFAULT_MODEL = "text-embedding-3-small"

    def __init__(
        self,
        model: str = DEFAULT_MODEL,
        api_key: Optional[str] = None,
        base_url: Optional[str] = None
    ):
        self.model = model
        self._api_key = api_key or settings.openai_api_key
        self._base_url = base_url or settings.openai_base_url
        self._client: Optional[AsyncOpenAI] = None
        self._cache: Dict[str, List[float]] = {}

    def _get_client(self) -> AsyncOpenAI:
        """Get or create OpenAI client."""
        if self._client is None:
            if not self._api_key:
                raise ValueError("OpenAI API key not configured")
            self._client = AsyncOpenAI(
                api_key=self._api_key,
                base_url=self._base_url
            )
        return self._client

    def get_embedding_dimension(self) -> int:
        """Get the dimension of embeddings for the current model.

        Returns:
            Embedding dimension
        """
        return EMBEDDING_DIMENSIONS.get(self.model, 1536)

    def _get_cache_key(self, text: str) -> str:
        """Generate cache key for text."""
        return hashlib.md5(f"{self.model}:{text}".encode()).hexdigest()

    async def embed(self, text: str) -> List[float]:
        """Generate embedding for a single text.

        Args:
            text: Text to embed

        Returns:
            Embedding vector

        Raises:
            ValueError: If text is empty
            APIError: If API call fails
        """
        if not text or not text.strip():
            raise ValueError("Cannot embed empty text")

        text = text.strip()

        # Check cache
        cache_key = self._get_cache_key(text)
        if cache_key in self._cache:
            logger.debug(f"Cache hit for text (hash: {cache_key[:8]}...)")
            return self._cache[cache_key]

        # Call API
        client = self._get_client()

        try:
            response = await client.embeddings.create(
                model=self.model,
                input=text
            )

            embedding = response.data[0].embedding

            # Cache result
            self._cache[cache_key] = embedding

            return embedding

        except RateLimitError as e:
            logger.error(f"Rate limit error: {e}")
            raise
        except APIError as e:
            logger.error(f"API error: {e}")
            raise

    async def embed_batch(self, texts: List[str]) -> List[List[float]]:
        """Generate embeddings for multiple texts.

        Args:
            texts: List of texts to embed

        Returns:
            List of embedding vectors
        """
        if not texts:
            return []

        # Filter out cached texts
        uncached_texts = []
        cache_keys = []
        results = [None] * len(texts)

        for i, text in enumerate(texts):
            if not text or not text.strip():
                raise ValueError(f"Text at index {i} is empty")

            text = text.strip()
            cache_key = self._get_cache_key(text)

            if cache_key in self._cache:
                results[i] = self._cache[cache_key]
            else:
                uncached_texts.append((i, text, cache_key))
                cache_keys.append(cache_key)

        # Batch embed uncached texts
        if uncached_texts:
            client = self._get_client()

            try:
                response = await client.embeddings.create(
                    model=self.model,
                    input=[t[1] for t in uncached_texts]
                )

                for j, (original_idx, text, cache_key) in enumerate(uncached_texts):
                    embedding = response.data[j].embedding
                    results[original_idx] = embedding
                    self._cache[cache_key] = embedding

            except (RateLimitError, APIError) as e:
                logger.error(f"Batch embedding error: {e}")
                raise

        return results

    def clear_cache(self):
        """Clear the embedding cache."""
        self._cache.clear()
        logger.info("Embedding cache cleared")

    def is_configured(self) -> bool:
        """Check if the service is properly configured."""
        return self._api_key is not None


# Global service instance
embedding_service = EmbeddingService()
