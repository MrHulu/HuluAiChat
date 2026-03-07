"""RAG service for document-based chat.

核心功能：
- 文档索引（处理 + 分块 + 嵌入）
- 语义检索
- 上下文构建
- 引用来源显示
"""
import logging
import uuid
from dataclasses import dataclass, field
from typing import Optional, List, Dict, Any

from services.document_processor import DocumentProcessor, Chunk
from services.embedding_service import EmbeddingService

logger = logging.getLogger(__name__)


@dataclass
class RetrievedChunk:
    """A retrieved chunk with metadata."""
    content: str
    source: str
    chunk_index: int
    score: float


@dataclass
class IndexResult:
    """Result of document indexing."""
    success: bool
    doc_id: str
    chunk_count: int
    error: Optional[str] = None


@dataclass
class DeleteResult:
    """Result of document deletion."""
    success: bool
    doc_id: str
    error: Optional[str] = None


@dataclass
class DocumentInfo:
    """Information about an indexed document."""
    doc_id: str
    filename: str
    chunk_count: int


class RAGService:
    """Service for RAG (Retrieval-Augmented Generation).

    使用 Chroma 向量数据库进行文档存储和检索。
    """

    DEFAULT_COLLECTION_NAME = "huluchat_documents"
    DEFAULT_N_RESULTS = 5

    def __init__(
        self,
        collection_name: str = DEFAULT_COLLECTION_NAME,
        persist_directory: Optional[str] = None,
        embedding_service: Optional[EmbeddingService] = None,
        document_processor: Optional[DocumentProcessor] = None
    ):
        self.collection_name = collection_name
        self.persist_directory = persist_directory
        self._embedding_service = embedding_service
        self._document_processor = document_processor
        self._collection = None
        self._chroma_client = None
        self.default_n_results = self.DEFAULT_N_RESULTS

    @property
    def embedding_service(self) -> EmbeddingService:
        """Get or create embedding service."""
        if self._embedding_service is None:
            self._embedding_service = EmbeddingService()
        return self._embedding_service

    @property
    def document_processor(self) -> DocumentProcessor:
        """Get or create document processor."""
        if self._document_processor is None:
            self._document_processor = DocumentProcessor()
        return self._document_processor

    def _get_collection(self):
        """Get or create Chroma collection."""
        if self._collection is None:
            import chromadb

            if self.persist_directory:
                self._chroma_client = chromadb.PersistentClient(
                    path=self.persist_directory
                )
            else:
                self._chroma_client = chromadb.EphemeralClient()

            self._collection = self._chroma_client.get_or_create_collection(
                name=self.collection_name,
                metadata={"hnsw:space": "cosine"}
            )

        return self._collection

    async def index_document(
        self,
        doc_id: str,
        content: str,
        filename: str
    ) -> IndexResult:
        """Index a document for retrieval.

        Args:
            doc_id: Unique document identifier
            content: Document content
            filename: Original filename

        Returns:
            IndexResult with indexing status
        """
        try:
            # Process and chunk the document
            chunks = self.document_processor.chunk_text(content, source=filename)

            if not chunks:
                return IndexResult(
                    success=False,
                    doc_id=doc_id,
                    chunk_count=0,
                    error="Document produced no chunks"
                )

            # Generate embeddings for all chunks
            chunk_texts = [chunk.content for chunk in chunks]
            embeddings = await self.embedding_service.embed_batch(chunk_texts)

            # Prepare metadata
            ids = []
            metadatas = []

            for i, chunk in enumerate(chunks):
                chunk_id = f"{doc_id}-chunk{i}"
                ids.append(chunk_id)
                metadatas.append({
                    "doc_id": doc_id,
                    "source": chunk.source,
                    "chunk_index": chunk.chunk_index,
                    "start_char": chunk.start_char,
                    "end_char": chunk.end_char
                })

            # Add to collection
            collection = self._get_collection()
            collection.add(
                ids=ids,
                embeddings=embeddings,
                documents=chunk_texts,
                metadatas=metadatas
            )

            logger.info(f"Indexed document {doc_id} with {len(chunks)} chunks")

            return IndexResult(
                success=True,
                doc_id=doc_id,
                chunk_count=len(chunks)
            )

        except Exception as e:
            logger.error(f"Failed to index document {doc_id}: {e}")
            return IndexResult(
                success=False,
                doc_id=doc_id,
                chunk_count=0,
                error=str(e)
            )

    async def retrieve(
        self,
        query: str,
        n_results: Optional[int] = None
    ) -> List[RetrievedChunk]:
        """Retrieve relevant chunks for a query.

        Args:
            query: Search query
            n_results: Number of results to return

        Returns:
            List of RetrievedChunk objects
        """
        n_results = n_results or self.default_n_results

        try:
            # Generate query embedding
            query_embedding = await self.embedding_service.embed(query)

            # Query the collection
            collection = self._get_collection()
            results = collection.query(
                query_embeddings=[query_embedding],
                n_results=n_results,
                include=["documents", "metadatas", "distances"]
            )

            # Convert to RetrievedChunk objects
            chunks = []

            if results['ids'] and results['ids'][0]:
                for i, doc_id in enumerate(results['ids'][0]):
                    # Convert distance to similarity score (1 - distance for cosine)
                    distance = results['distances'][0][i] if results.get('distances') else 0
                    score = 1 - distance

                    chunk = RetrievedChunk(
                        content=results['documents'][0][i],
                        source=results['metadatas'][0][i].get('source', 'unknown'),
                        chunk_index=results['metadatas'][0][i].get('chunk_index', 0),
                        score=score
                    )
                    chunks.append(chunk)

            return chunks

        except Exception as e:
            logger.error(f"Failed to retrieve: {e}")
            return []

    async def delete_document(self, doc_id: str) -> DeleteResult:
        """Delete a document and all its chunks.

        Args:
            doc_id: Document ID to delete

        Returns:
            DeleteResult with deletion status
        """
        try:
            collection = self._get_collection()

            # Find all chunks for this document
            results = collection.get(
                where={"doc_id": doc_id}
            )

            if results['ids']:
                collection.delete(ids=results['ids'])
                logger.info(f"Deleted document {doc_id} ({len(results['ids'])} chunks)")
            else:
                logger.info(f"Document {doc_id} not found (already deleted?)")

            return DeleteResult(
                success=True,
                doc_id=doc_id
            )

        except Exception as e:
            logger.error(f"Failed to delete document {doc_id}: {e}")
            return DeleteResult(
                success=False,
                doc_id=doc_id,
                error=str(e)
            )

    async def list_documents(self) -> List[DocumentInfo]:
        """List all indexed documents.

        Returns:
            List of DocumentInfo objects
        """
        try:
            collection = self._get_collection()
            results = collection.get()

            # Group by doc_id
            doc_map: Dict[str, DocumentInfo] = {}

            if results['metadatas']:
                for i, metadata in enumerate(results['metadatas']):
                    doc_id = metadata.get('doc_id', 'unknown')
                    source = metadata.get('source', 'unknown')

                    if doc_id not in doc_map:
                        doc_map[doc_id] = DocumentInfo(
                            doc_id=doc_id,
                            filename=source,
                            chunk_count=0
                        )
                    doc_map[doc_id].chunk_count += 1

            return list(doc_map.values())

        except Exception as e:
            logger.error(f"Failed to list documents: {e}")
            return []

    def build_context(
        self,
        chunks: List[RetrievedChunk],
        include_citations: bool = True
    ) -> str:
        """Build context string from retrieved chunks.

        Args:
            chunks: List of retrieved chunks
            include_citations: Whether to include citation markers

        Returns:
            Context string for the LLM
        """
        if not chunks:
            return ""

        context_parts = []

        for i, chunk in enumerate(chunks):
            if include_citations:
                citation = f"[{chunk.source}#{chunk.chunk_index}]"
                context_parts.append(f"{citation}\n{chunk.content}")
            else:
                context_parts.append(chunk.content)

        return "\n\n---\n\n".join(context_parts)

    def clear_collection(self):
        """Clear all documents from the collection."""
        try:
            if self._chroma_client and self._collection:
                self._chroma_client.delete_collection(self.collection_name)
                self._collection = None
                logger.info(f"Cleared collection {self.collection_name}")
        except Exception as e:
            logger.error(f"Failed to clear collection: {e}")


# Global service instance
rag_service = RAGService()
