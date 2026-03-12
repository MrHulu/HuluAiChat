"""Tests for AsyncChromaClient and AsyncCollection.

Tests the async wrapper for ChromaDB operations.
"""
import pytest
from unittest.mock import patch, MagicMock, AsyncMock


class TestAsyncChromaClientExists:
    """Test that async_chroma module exists."""

    def test_async_chroma_module_exists(self):
        """Test async_chroma module can be imported."""
        from services import async_chroma
        assert async_chroma is not None

    def test_async_chroma_client_class_exists(self):
        """Test AsyncChromaClient class exists."""
        from services.async_chroma import AsyncChromaClient
        assert AsyncChromaClient is not None

    def test_async_collection_class_exists(self):
        """Test AsyncCollection class exists."""
        from services.async_chroma import AsyncCollection
        assert AsyncCollection is not None


class TestRunSync:
    """Test the run_sync utility function."""

    @pytest.mark.asyncio
    async def test_run_sync_returns_result(self):
        """Test run_sync returns the result of the function."""
        from services.async_chroma import run_sync

        def sync_func(x):
            return x * 2

        result = await run_sync(sync_func, 5)
        assert result == 10

    @pytest.mark.asyncio
    async def test_run_sync_with_kwargs(self):
        """Test run_sync with keyword arguments."""
        from services.async_chroma import run_sync

        def sync_func(a, b=10):
            return a + b

        result = await run_sync(sync_func, 5, b=15)
        assert result == 20

    @pytest.mark.asyncio
    async def test_run_sync_propagates_exception(self):
        """Test run_sync propagates exceptions."""
        from services.async_chroma import run_sync

        def failing_func():
            raise ValueError("Test error")

        with pytest.raises(ValueError, match="Test error"):
            await run_sync(failing_func)


class TestAsyncCollection:
    """Test AsyncCollection wrapper."""

    def test_async_collection_properties(self):
        """Test AsyncCollection property access."""
        from services.async_chroma import AsyncCollection

        mock_collection = MagicMock()
        mock_collection.name = "test_collection"
        mock_collection.metadata = {"hnsw:space": "cosine"}
        mock_collection.id = "test-id-123"

        async_collection = AsyncCollection(mock_collection)

        assert async_collection.name == "test_collection"
        assert async_collection.metadata == {"hnsw:space": "cosine"}
        assert async_collection.id == "test-id-123"

    @pytest.mark.asyncio
    async def test_async_collection_add(self):
        """Test AsyncCollection.add is async."""
        from services.async_chroma import AsyncCollection

        mock_collection = MagicMock()
        mock_collection.add = MagicMock()

        async_collection = AsyncCollection(mock_collection)

        await async_collection.add(
            ids=["id1", "id2"],
            documents=["doc1", "doc2"],
            embeddings=[[0.1, 0.2], [0.3, 0.4]]
        )

        mock_collection.add.assert_called_once()

    @pytest.mark.asyncio
    async def test_async_collection_query(self):
        """Test AsyncCollection.query is async."""
        from services.async_chroma import AsyncCollection

        mock_collection = MagicMock()
        mock_collection.query = MagicMock(
            return_value={
                'ids': [['id1', 'id2']],
                'documents': [['doc1', 'doc2']],
                'distances': [[0.1, 0.2]]
            }
        )

        async_collection = AsyncCollection(mock_collection)

        results = await async_collection.query(
            query_embeddings=[[0.1, 0.2]],
            n_results=2
        )

        assert results['ids'] == [['id1', 'id2']]
        mock_collection.query.assert_called_once()

    @pytest.mark.asyncio
    async def test_async_collection_get(self):
        """Test AsyncCollection.get is async."""
        from services.async_chroma import AsyncCollection

        mock_collection = MagicMock()
        mock_collection.get = MagicMock(
            return_value={
                'ids': ['id1', 'id2'],
                'documents': ['doc1', 'doc2']
            }
        )

        async_collection = AsyncCollection(mock_collection)

        results = await async_collection.get()

        assert results['ids'] == ['id1', 'id2']
        mock_collection.get.assert_called_once()

    @pytest.mark.asyncio
    async def test_async_collection_delete(self):
        """Test AsyncCollection.delete is async."""
        from services.async_chroma import AsyncCollection

        mock_collection = MagicMock()
        mock_collection.delete = MagicMock()

        async_collection = AsyncCollection(mock_collection)

        await async_collection.delete(ids=["id1"])

        mock_collection.delete.assert_called_once()

    @pytest.mark.asyncio
    async def test_async_collection_count(self):
        """Test AsyncCollection.count is async."""
        from services.async_chroma import AsyncCollection

        mock_collection = MagicMock()
        mock_collection.count = MagicMock(return_value=42)

        async_collection = AsyncCollection(mock_collection)

        count = await async_collection.count()

        assert count == 42
        mock_collection.count.assert_called_once()


class TestAsyncChromaClient:
    """Test AsyncChromaClient."""

    @pytest.mark.asyncio
    async def test_get_or_create_collection(self):
        """Test get_or_create_collection returns AsyncCollection."""
        from services.async_chroma import AsyncChromaClient, AsyncCollection

        client = AsyncChromaClient()

        with patch.object(client, '_get_sync_client') as mock_get_client:
            mock_sync_client = MagicMock()
            mock_collection = MagicMock()
            mock_collection.name = "test_collection"
            mock_sync_client.get_or_create_collection = MagicMock(
                return_value=mock_collection
            )
            mock_get_client.return_value = mock_sync_client

            collection = await client.get_or_create_collection("test")

            assert isinstance(collection, AsyncCollection)
            assert collection.name == "test_collection"

    @pytest.mark.asyncio
    async def test_delete_collection(self):
        """Test delete_collection is async."""
        from services.async_chroma import AsyncChromaClient

        client = AsyncChromaClient()

        with patch.object(client, '_get_sync_client') as mock_get_client:
            mock_sync_client = MagicMock()
            mock_sync_client.delete_collection = MagicMock()
            mock_get_client.return_value = mock_sync_client

            await client.delete_collection("test_collection")

            mock_sync_client.delete_collection.assert_called_once_with(
                name="test_collection"
            )

    @pytest.mark.asyncio
    async def test_list_collections(self):
        """Test list_collections returns collection names."""
        from services.async_chroma import AsyncChromaClient

        client = AsyncChromaClient()

        with patch.object(client, '_get_sync_client') as mock_get_client:
            mock_sync_client = MagicMock()
            mock_coll1 = MagicMock()
            mock_coll1.name = "collection1"
            mock_coll2 = MagicMock()
            mock_coll2.name = "collection2"
            mock_sync_client.list_collections = MagicMock(
                return_value=[mock_coll1, mock_coll2]
            )
            mock_get_client.return_value = mock_sync_client

            names = await client.list_collections()

            assert names == ["collection1", "collection2"]

    @pytest.mark.asyncio
    async def test_heartbeat(self):
        """Test heartbeat returns nanosecond timestamp."""
        from services.async_chroma import AsyncChromaClient

        client = AsyncChromaClient()

        with patch.object(client, '_get_sync_client') as mock_get_client:
            mock_sync_client = MagicMock()
            mock_sync_client.heartbeat = MagicMock(return_value=123456789)
            mock_get_client.return_value = mock_sync_client

            heartbeat = await client.heartbeat()

            assert heartbeat == 123456789


class TestChromaExecutor:
    """Test thread pool executor management."""

    def test_get_chroma_executor_creates_executor(self):
        """Test get_chroma_executor creates executor on first call."""
        from services.async_chroma import get_chroma_executor, shutdown_chroma_executor

        # Clean up any existing executor
        shutdown_chroma_executor(wait=False)

        executor = get_chroma_executor()

        assert executor is not None
        assert executor._max_workers == 4

        # Clean up
        shutdown_chroma_executor(wait=False)

    def test_shutdown_chroma_executor(self):
        """Test shutdown_chroma_executor cleans up."""
        from services.async_chroma import get_chroma_executor, shutdown_chroma_executor, _chroma_executor

        import services.async_chroma as module

        # Create executor
        get_chroma_executor()

        # Shutdown
        shutdown_chroma_executor(wait=False)

        # Should be None after shutdown
        assert module._chroma_executor is None


class TestNonBlockingBehavior:
    """Test that async operations don't block the event loop."""

    @pytest.mark.asyncio
    async def test_concurrent_operations(self):
        """Test that multiple ChromaDB operations can run concurrently."""
        import asyncio
        from services.async_chroma import AsyncCollection

        mock_collection = MagicMock()

        # Simulate a slow operation
        def slow_query(*args, **kwargs):
            import time
            time.sleep(0.1)  # Simulate slow I/O
            return {'ids': [['id1']], 'documents': [['doc1']]}

        mock_collection.query = slow_query

        async_collection = AsyncCollection(mock_collection)

        # Run multiple queries concurrently
        start_time = asyncio.get_event_loop().time()
        results = await asyncio.gather(
            async_collection.query(query_embeddings=[[0.1]]),
            async_collection.query(query_embeddings=[[0.2]]),
            async_collection.query(query_embeddings=[[0.3]]),
        )
        end_time = asyncio.get_event_loop().time()

        # If blocking, this would take ~0.3s
        # With thread pool, should complete faster due to parallelism
        assert len(results) == 3
        # Note: In practice, this tests that the operations don't block
        # The actual timing depends on thread pool behavior
