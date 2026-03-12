"""Async wrapper for ChromaDB operations.

ChromaDB operations are synchronous and can block the event loop.
This module provides async wrappers that run ChromaDB operations
in a thread pool to avoid blocking.

Usage:
    from services.async_chroma import AsyncChromaClient

    client = AsyncChromaClient(persist_directory="./chroma_data")
    collection = await client.get_or_create_collection("my_collection")

    # Add documents (async)
    await collection.add(
        ids=["id1", "id2"],
        documents=["doc1", "doc2"],
        embeddings=[[0.1, ...], [0.2, ...]]
    )

    # Query (async)
    results = await collection.query(
        query_embeddings=[[0.1, ...]],
        n_results=5
    )
"""
import asyncio
import logging
from concurrent.futures import ThreadPoolExecutor
from functools import wraps
from typing import Optional, List, Dict, Any, Callable, TypeVar, ParamSpec

import chromadb
from chromadb.api.models.Collection import Collection

logger = logging.getLogger(__name__)

# Thread pool for ChromaDB operations
_chroma_executor: Optional[ThreadPoolExecutor] = None

P = ParamSpec("P")
T = TypeVar("T")


def get_chroma_executor() -> ThreadPoolExecutor:
    """Get or create the ChromaDB thread pool executor."""
    global _chroma_executor
    if _chroma_executor is None:
        _chroma_executor = ThreadPoolExecutor(
            max_workers=4,
            thread_name_prefix="chroma-"
        )
    return _chroma_executor


async def run_sync(func: Callable[P, T], *args: P.args, **kwargs: P.kwargs) -> T:
    """Run a synchronous function in the ChromaDB thread pool.

    Args:
        func: Synchronous function to run
        *args: Positional arguments
        **kwargs: Keyword arguments

    Returns:
        Result of the function
    """
    executor = get_chroma_executor()
    loop = asyncio.get_event_loop()

    @wraps(func)
    def wrapper():
        return func(*args, **kwargs)

    return await loop.run_in_executor(executor, wrapper)


class AsyncCollection:
    """Async wrapper for ChromaDB Collection.

    Provides async versions of all Collection methods by running
    them in a thread pool.
    """

    def __init__(self, collection: Collection):
        """Initialize with a sync Collection.

        Args:
            collection: Synchronous ChromaDB Collection
        """
        self._collection = collection

    @property
    def name(self) -> str:
        """Get collection name."""
        return self._collection.name

    @property
    def metadata(self) -> Optional[Dict[str, Any]]:
        """Get collection metadata."""
        return self._collection.metadata

    @property
    def id(self) -> str:
        """Get collection ID."""
        return self._collection.id

    async def add(
        self,
        ids: List[str],
        embeddings: Optional[List[List[float]]] = None,
        metadatas: Optional[List[Dict[str, Any]]] = None,
        documents: Optional[List[str]] = None,
        images: Optional[List[bytes]] = None,
        uris: Optional[List[str]] = None,
    ) -> None:
        """Add embeddings/documents to the collection (async)."""
        await run_sync(
            self._collection.add,
            ids=ids,
            embeddings=embeddings,
            metadatas=metadatas,
            documents=documents,
            images=images,
            uris=uris,
        )

    async def update(
        self,
        ids: List[str],
        embeddings: Optional[List[List[float]]] = None,
        metadatas: Optional[List[Dict[str, Any]]] = None,
        documents: Optional[List[str]] = None,
        images: Optional[List[bytes]] = None,
        uris: Optional[List[str]] = None,
    ) -> None:
        """Update embeddings/documents in the collection (async)."""
        await run_sync(
            self._collection.update,
            ids=ids,
            embeddings=embeddings,
            metadatas=metadatas,
            documents=documents,
            images=images,
            uris=uris,
        )

    async def upsert(
        self,
        ids: List[str],
        embeddings: Optional[List[List[float]]] = None,
        metadatas: Optional[List[Dict[str, Any]]] = None,
        documents: Optional[List[str]] = None,
        images: Optional[List[bytes]] = None,
        uris: Optional[List[str]] = None,
    ) -> None:
        """Upsert embeddings/documents in the collection (async)."""
        await run_sync(
            self._collection.upsert,
            ids=ids,
            embeddings=embeddings,
            metadatas=metadatas,
            documents=documents,
            images=images,
            uris=uris,
        )

    async def get(
        self,
        ids: Optional[List[str]] = None,
        where: Optional[Dict[str, Any]] = None,
        limit: Optional[int] = None,
        offset: Optional[int] = None,
        where_document: Optional[Dict[str, Any]] = None,
        include: Optional[List[str]] = None,
    ) -> Dict[str, Any]:
        """Get embeddings/documents from the collection (async)."""
        return await run_sync(
            self._collection.get,
            ids=ids,
            where=where,
            limit=limit,
            offset=offset,
            where_document=where_document,
            include=include,
        )

    async def delete(
        self,
        ids: Optional[List[str]] = None,
        where: Optional[Dict[str, Any]] = None,
        where_document: Optional[Dict[str, Any]] = None,
    ) -> None:
        """Delete embeddings/documents from the collection (async)."""
        await run_sync(
            self._collection.delete,
            ids=ids,
            where=where,
            where_document=where_document,
        )

    async def query(
        self,
        query_embeddings: Optional[List[List[float]]] = None,
        query_texts: Optional[List[str]] = None,
        query_images: Optional[List[bytes]] = None,
        query_uris: Optional[List[str]] = None,
        n_results: int = 10,
        where: Optional[Dict[str, Any]] = None,
        where_document: Optional[Dict[str, Any]] = None,
        include: Optional[List[str]] = None,
    ) -> Dict[str, Any]:
        """Query the collection (async)."""
        return await run_sync(
            self._collection.query,
            query_embeddings=query_embeddings,
            query_texts=query_texts,
            query_images=query_images,
            query_uris=query_uris,
            n_results=n_results,
            where=where,
            where_document=where_document,
            include=include,
        )

    async def count(self) -> int:
        """Count documents in the collection (async)."""
        return await run_sync(self._collection.count)

    async def modify(
        self,
        name: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> None:
        """Modify collection name or metadata (async)."""
        await run_sync(
            self._collection.modify,
            name=name,
            metadata=metadata,
        )


class AsyncChromaClient:
    """Async wrapper for ChromaDB Client.

    Provides async versions of client methods and returns
    AsyncCollection instances.
    """

    def __init__(
        self,
        persist_directory: Optional[str] = None,
        **kwargs: Any
    ):
        """Initialize the async client.

        Args:
            persist_directory: Directory for persistent storage
            **kwargs: Additional arguments passed to ChromaDB client
        """
        self._persist_directory = persist_directory
        self._kwargs = kwargs
        self._sync_client: Optional[chromadb.ClientAPI] = None

    def _get_sync_client(self) -> chromadb.ClientAPI:
        """Get or create the sync client (lazy initialization)."""
        if self._sync_client is None:
            if self._persist_directory:
                self._sync_client = chromadb.PersistentClient(
                    path=self._persist_directory,
                    **self._kwargs
                )
            else:
                self._sync_client = chromadb.EphemeralClient(**self._kwargs)
        return self._sync_client

    async def get_or_create_collection(
        self,
        name: str,
        metadata: Optional[Dict[str, Any]] = None,
        embedding_function: Optional[Any] = None,
        get_or_create: bool = True,
    ) -> AsyncCollection:
        """Get or create a collection (async).

        Args:
            name: Collection name
            metadata: Collection metadata
            embedding_function: Optional embedding function
            get_or_create: Whether to get existing or create new

        Returns:
            AsyncCollection instance
        """
        client = self._get_sync_client()
        collection = await run_sync(
            client.get_or_create_collection,
            name=name,
            metadata=metadata,
            embedding_function=embedding_function,
        )
        return AsyncCollection(collection)

    async def get_collection(
        self,
        name: str,
        embedding_function: Optional[Any] = None,
    ) -> AsyncCollection:
        """Get an existing collection (async).

        Args:
            name: Collection name
            embedding_function: Optional embedding function

        Returns:
            AsyncCollection instance

        Raises:
            ValueError: If collection doesn't exist
        """
        client = self._get_sync_client()
        collection = await run_sync(
            client.get_collection,
            name=name,
            embedding_function=embedding_function,
        )
        return AsyncCollection(collection)

    async def create_collection(
        self,
        name: str,
        metadata: Optional[Dict[str, Any]] = None,
        embedding_function: Optional[Any] = None,
    ) -> AsyncCollection:
        """Create a new collection (async).

        Args:
            name: Collection name
            metadata: Collection metadata
            embedding_function: Optional embedding function

        Returns:
            AsyncCollection instance

        Raises:
            ValueError: If collection already exists
        """
        client = self._get_sync_client()
        collection = await run_sync(
            client.create_collection,
            name=name,
            metadata=metadata,
            embedding_function=embedding_function,
        )
        return AsyncCollection(collection)

    async def delete_collection(self, name: str) -> None:
        """Delete a collection (async).

        Args:
            name: Collection name to delete
        """
        client = self._get_sync_client()
        await run_sync(client.delete_collection, name=name)

    async def list_collections(self) -> List[str]:
        """List all collection names (async).

        Returns:
            List of collection names
        """
        client = self._get_sync_client()
        collections = await run_sync(client.list_collections)
        return [c.name for c in collections]

    async def heartbeat(self) -> int:
        """Check server heartbeat (async).

        Returns:
            Nanosecond heartbeat
        """
        client = self._get_sync_client()
        return await run_sync(client.heartbeat)

    def reset(self) -> None:
        """Reset the client (sync - dangerous operation)."""
        client = self._get_sync_client()
        client.reset()


def shutdown_chroma_executor(wait: bool = True) -> None:
    """Shutdown the ChromaDB thread pool executor.

    Call this during application shutdown.

    Args:
        wait: Whether to wait for pending tasks
    """
    global _chroma_executor
    if _chroma_executor is not None:
        _chroma_executor.shutdown(wait=wait)
        _chroma_executor = None
        logger.info("ChromaDB executor shutdown complete")
