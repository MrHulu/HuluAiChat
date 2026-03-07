"""RAG API endpoints.

单文档对话基础版：
- POST /upload - 上传文档
- POST /query - 查询相关内容
- GET /documents - 列出文档
- DELETE /documents/{doc_id} - 删除文档
"""
import uuid
import logging
from typing import Optional

from fastapi import APIRouter, UploadFile, File, HTTPException
from pydantic import BaseModel

from services.rag_service import rag_service, RAGService
from services.document_processor import DocumentProcessor

router = APIRouter()
logger = logging.getLogger(__name__)

# Constants
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5MB
SUPPORTED_EXTENSIONS = {".txt", ".md", ".pdf"}

# Document processor for PDF handling
document_processor = DocumentProcessor()


class QueryRequest(BaseModel):
    """Request model for querying documents."""
    query: str
    n_results: int = 5


class QueryResponse(BaseModel):
    """Response model for query results."""
    success: bool
    chunks: list
    context: str


class UploadResponse(BaseModel):
    """Response model for document upload."""
    success: bool
    doc_id: str
    filename: str
    chunk_count: int
    error: Optional[str] = None


class DocumentListResponse(BaseModel):
    """Response model for listing documents."""
    documents: list


class DeleteResponse(BaseModel):
    """Response model for document deletion."""
    success: bool
    doc_id: str
    error: Optional[str] = None


@router.post("/upload", response_model=UploadResponse)
async def upload_document(file: UploadFile = File(...)):
    """Upload and index a document.

    支持格式：TXT, MD, PDF
    最大文件大小：5MB
    """
    # Check file size
    content = await file.read()

    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=413,
            detail=f"File too large. Maximum size is {MAX_FILE_SIZE // (1024*1024)}MB"
        )

    # Check file extension
    filename = file.filename or "unknown"
    try:
        file_type = document_processor.detect_file_type(filename)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    # Process file content
    if file_type == "pdf":
        result = document_processor.process_pdf_bytes(content, filename)
        text_content = result.content
    else:
        text_content = content.decode("utf-8")

    if not text_content.strip():
        raise HTTPException(
            status_code=400,
            detail="File is empty or could not be parsed"
        )

    # Generate document ID
    doc_id = str(uuid.uuid4())

    # Index the document
    index_result = await rag_service.index_document(
        doc_id=doc_id,
        content=text_content,
        filename=filename
    )

    if not index_result.success:
        return UploadResponse(
            success=False,
            doc_id=doc_id,
            filename=filename,
            chunk_count=0,
            error=index_result.error
        )

    return UploadResponse(
        success=True,
        doc_id=doc_id,
        filename=filename,
        chunk_count=index_result.chunk_count
    )


@router.post("/query", response_model=QueryResponse)
async def query_documents(request: QueryRequest):
    """Query indexed documents.

    返回相关文档块和构建的上下文。
    """
    # Retrieve relevant chunks
    chunks = await rag_service.retrieve(
        query=request.query,
        n_results=request.n_results
    )

    # Build context
    context = rag_service.build_context(chunks, include_citations=True)

    # Format chunks for response
    formatted_chunks = [
        {
            "content": chunk.content,
            "source": chunk.source,
            "chunk_index": chunk.chunk_index,
            "score": chunk.score
        }
        for chunk in chunks
    ]

    return QueryResponse(
        success=True,
        chunks=formatted_chunks,
        context=context
    )


@router.get("/documents", response_model=DocumentListResponse)
async def list_documents():
    """List all indexed documents."""
    docs = await rag_service.list_documents()

    formatted_docs = [
        {
            "doc_id": doc.doc_id,
            "filename": doc.filename,
            "chunk_count": doc.chunk_count
        }
        for doc in docs
    ]

    return DocumentListResponse(documents=formatted_docs)


@router.delete("/documents/{doc_id}", response_model=DeleteResponse)
async def delete_document(doc_id: str):
    """Delete a document and all its chunks."""
    result = await rag_service.delete_document(doc_id)

    return DeleteResponse(
        success=result.success,
        doc_id=doc_id,
        error=result.error
    )
