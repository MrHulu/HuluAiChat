"""Chat API with WebSocket streaming."""
import uuid
import json
import logging
from datetime import datetime
from typing import Optional, List

from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from core.database import get_session as get_db_session
from models.schemas import MessageModel
from sqlalchemy import delete as sql_delete
from services.openai_service import openai_service
from services.ollama_service import ollama_service
from services.mcp_service import mcp_service
from services.mcp_tool_adapter import (
    mcp_tools_to_openai_format,
    parse_mcp_tool_call,
    format_tool_call_message,
    build_tool_result_message,
)

router = APIRouter()
logger = logging.getLogger(__name__)


def get_service_for_model(model: Optional[str]):
    """Get the appropriate service based on model name.

    Args:
        model: Model identifier (e.g., "gpt-4o", "ollama:llama2", "claude-3-5-sonnet")

    Returns:
        Service instance (OpenAIService or OllamaService) and cleaned model name
    """
    if model and model.startswith("ollama:"):
        # Use Ollama for models with "ollama:" prefix
        return ollama_service, model.replace("ollama:", "", 1)
    else:
        # Use OpenAI for everything else (including claude-* models)
        return openai_service, model


class ConnectionManager:
    """Manage WebSocket connections."""

    def __init__(self):
        self.active_connections: dict[str, WebSocket] = {}

    async def connect(self, websocket: WebSocket, session_id: str):
        await websocket.accept()
        self.active_connections[session_id] = websocket

    def disconnect(self, session_id: str):
        if session_id in self.active_connections:
            del self.active_connections[session_id]

    async def send_json(self, session_id: str, data: dict):
        if session_id in self.active_connections:
            await self.active_connections[session_id].send_json(data)


manager = ConnectionManager()


async def get_session_messages(
    db: AsyncSession,
    session_id: str,
    limit: int = 50
) -> list[dict]:
    """Get message history for a session.

    Returns messages in OpenAI format:
    - Text only: {"role": "user", "content": "text"}
    - With images: {"role": "user", "content": [{"type": "text", ...}, {"type": "image_url", ...}]}
    - With files: File content is extracted and appended to text content
    """
    result = await db.execute(
        select(MessageModel)
        .where(MessageModel.session_id == session_id)
        .order_by(MessageModel.created_at.asc())
        .limit(limit)
    )
    messages = result.scalars().all()

    formatted = []
    for m in messages:
        msg = {"role": m.role}
        content = m.content

        # Handle file attachments - extract text content for AI context
        if m.files:
            try:
                files = json.loads(m.files)
                file_context = _extract_file_context(files)
                if file_context:
                    content = f"{content}\n\n{file_context}" if content else file_context
            except json.JSONDecodeError:
                pass

        if m.images:
            # Multimodal message with images
            try:
                images = json.loads(m.images)
                msg["content"] = [{"type": "text", "text": content}] + images
            except json.JSONDecodeError:
                msg["content"] = content
        else:
            # Text only message (may include extracted file content)
            msg["content"] = content
        formatted.append(msg)

    return formatted


def _extract_file_context(files: list[dict]) -> str:
    """Extract readable context from file attachments.

    For text files, decode and include content.
    For binary files, include metadata only.
    """
    contexts = []
    for file in files:
        name = file.get("name", "unknown")
        file_type = file.get("type", "")
        content = file.get("content", "")

        # Check if it's a text-based file type
        text_types = [
            "text/", "application/json", "application/javascript",
            "application/xml", "application/x-www-form-urlencoded"
        ]
        is_text = any(t in file_type for t in text_types)

        if is_text and content:
            try:
                # Extract text from data URL (data:xxx;base64,yyy)
                if content.startswith("data:"):
                    # Handle data URL format
                    import base64
                    parts = content.split(",", 1)
                    if len(parts) == 2:
                        encoded = parts[1]
                        decoded = base64.b64decode(encoded).decode("utf-8", errors="replace")
                        # Limit content length for context
                        if len(decoded) > 10000:
                            decoded = decoded[:10000] + "\n... (truncated)"
                        contexts.append(f"📄 File: {name}\n```\n{decoded}\n```")
                        continue
                # Plain text content
                contexts.append(f"📄 File: {name}\n```\n{content}\n```")
            except Exception:
                # If decoding fails, just add file info
                contexts.append(f"📄 File: {name} ({file_type})")
        else:
            # Binary file - just add metadata
            size = file.get("size", 0)
            size_str = f"{size} bytes" if size < 1024 else f"{size // 1024} KB"
            contexts.append(f"📎 File: {name} ({file_type}, {size_str})")

    return "\n\n".join(contexts)


async def save_message(
    db: AsyncSession,
    session_id: str,
    role: str,
    content: str,
    images: Optional[str] = None,
    files: Optional[str] = None,
    model_id: Optional[str] = None,
    regenerated_from: Optional[str] = None,
) -> MessageModel:
    """Save a message to the database.

    Args:
        db: Database session
        session_id: Session ID
        role: 'user' or 'assistant'
        content: Text content
        images: Optional JSON string of image data
        files: Optional JSON string of file attachments
        model_id: Optional model ID used to generate this message
        regenerated_from: Optional original message ID if this is a regeneration
    """
    message = MessageModel(
        id=str(uuid.uuid4()),
        session_id=session_id,
        role=role,
        content=content,
        images=images,
        files=files,
        model_id=model_id,
        regenerated_from=regenerated_from,
        regenerated_at=datetime.utcnow() if regenerated_from else None,
        created_at=datetime.utcnow(),
    )
    db.add(message)
    await db.commit()
    await db.refresh(message)
    return message


@router.websocket("/ws/{session_id}")
async def chat_websocket(
    websocket: WebSocket,
    session_id: str,
    db: AsyncSession = Depends(get_db_session),
):
    """WebSocket endpoint for streaming chat with AI."""
    await manager.connect(websocket, session_id)

    try:
        while True:
            # Receive message from client
            data = await websocket.receive_json()
            user_content = data.get("content", "")
            # Get images from client (list of base64 data URLs)
            images = data.get("images", [])
            # Get files from client (list of file attachments)
            files = data.get("files", [])
            # Get model from client, or use default
            request_model = data.get("model")
            # Get optional parameters from client
            temperature = data.get("temperature")  # None means use default
            top_p = data.get("top_p")  # None means use default
            max_tokens = data.get("max_tokens")  # None means use default
            # Get MCP enable flag
            use_mcp = data.get("use_mcp", True)  # Enable MCP tools by default
            # Get quoted message ID for reply context - TASK-200
            quoted_message_id = data.get("quoted_message_id")

            # Allow empty content if images or files are provided
            if not user_content.strip() and not images and not files:
                continue

            # Handle regenerate: delete messages after the specified message
            regenerate = data.get("regenerate", False)
            delete_from_message_id = data.get("delete_from_message_id")
            skip_save_user = False  # Flag to skip saving user message

            if regenerate and delete_from_message_id:
                # Delete all messages created after the specified message
                # This effectively removes the AI response and any subsequent messages
                try:
                    # Get the timestamp of the message to delete from
                    result = await db.execute(
                        select(MessageModel.created_at)
                        .where(MessageModel.id == delete_from_message_id)
                        .where(MessageModel.session_id == session_id)
                    )
                    msg_row = result.scalar_one_or_none()
                    if msg_row:
                        # Delete all messages after this timestamp (excluding the message itself)
                        await db.execute(
                            sql_delete(MessageModel)
                            .where(MessageModel.session_id == session_id)
                            .where(MessageModel.created_at > msg_row)
                        )
                        await db.commit()
                        logger.info(f"Regenerate: deleted messages after {delete_from_message_id}")
                        # Skip saving user message - it already exists (just updated or being reused)
                        skip_save_user = True
                except Exception as e:
                    logger.error(f"Failed to delete messages for regenerate: {e}")

            # Prepare images for storage (JSON string)
            images_json = json.dumps(images) if images else None
            # Prepare files for storage (JSON string)
            files_json = json.dumps(files) if files else None

            # Save user message (skip if this is a regenerate/edit request)
            if not skip_save_user:
                await save_message(db, session_id, "user", user_content, images_json, files_json)

            # Notify client that streaming is starting
            await manager.send_json(session_id, {
                "type": "stream_start",
                "session_id": session_id,
            })

            # Get conversation history for context
            history = await get_session_messages(db, session_id, limit=20)

            # Handle quoted message - add to context if provided - TASK-200
            if quoted_message_id:
                try:
                    quoted_result = await db.execute(
                        select(MessageModel)
                        .where(MessageModel.id == quoted_message_id)
                        .where(MessageModel.session_id == session_id)
                    )
                    quoted_msg = quoted_result.scalar_one_or_none()
                    if quoted_msg:
                        # Prepend quoted message context for AI to understand the reference
                        quoted_context = f"[引用回复] 之前的内容:\n{quoted_msg.content}\n\n---\n\n用户的新问题:"
                        # Insert quoted context marker before the user's message
                        # This helps AI understand the context without modifying user's actual message
                        history.append({
                            "role": "system",
                            "content": quoted_context
                        })
                        logger.info(f"Added quoted message context: {quoted_message_id}")
                except Exception as e:
                    logger.warning(f"Failed to get quoted message {quoted_message_id}: {e}")

            # Determine which service to use based on model
            service, model_name = get_service_for_model(request_model)
            is_ollama = service is ollama_service

            # Check service availability
            if is_ollama:
                # Ollama service check
                if not await ollama_service.is_available():
                    await manager.send_json(session_id, {
                        "type": "stream_chunk",
                        "content": "⚠️ Ollama 服务不可用。请确认 Ollama 正在运行，或切换到 OpenAI 模型。\n\n",
                    })
                    await manager.send_json(session_id, {
                        "type": "stream_end",
                        "session_id": session_id,
                    })
                    continue
            else:
                # OpenAI service check
                if not openai_service.is_configured():
                    # Fallback: echo mode when not configured
                    await manager.send_json(session_id, {
                        "type": "stream_chunk",
                        "content": "⚠️ OpenAI API Key not configured. Please set OPENAI_API_KEY environment variable.\n\n",
                    })
                    await manager.send_json(session_id, {
                        "type": "stream_chunk",
                        "content": f"You said: {user_content}",
                    })
                    # Save assistant message
                    await save_message(db, session_id, "assistant",
                        f"⚠️ OpenAI API Key not configured.\n\nYou said: {user_content}")
                    await manager.send_json(session_id, {
                        "type": "stream_end",
                        "session_id": session_id,
                    })
                    continue

            # Get MCP tools if enabled
            mcp_tools = None
            server_configs = {}
            if use_mcp and not is_ollama:  # MCP tools only work with OpenAI-compatible APIs
                try:
                    mcp_tools_raw = await mcp_service.get_all_tools()
                    if mcp_tools_raw:
                        mcp_tools = mcp_tools_to_openai_format(mcp_tools_raw)
                        # Store server configs for name lookup
                        servers = await mcp_service.list_servers()
                        server_configs = {s.id: s for s in servers}
                        logger.info(f"Loaded {len(mcp_tools)} MCP tools from {len(mcp_tools_raw)} servers")
                except Exception as e:
                    logger.warning(f"Failed to load MCP tools: {e}")

            # Stream AI response with potential tool calls
            full_response = ""
            try:
                # Build kwargs for service call based on service type
                service_kwargs = {
                    "messages": history,
                    "model": model_name,
                    "temperature": float(temperature) if temperature is not None else None,
                    "top_p": float(top_p) if top_p is not None else None,
                }
                # Ollama doesn't support max_tokens in the same way
                if not is_ollama and max_tokens is not None:
                    service_kwargs["max_tokens"] = int(max_tokens)

                # Add MCP tools if available
                if mcp_tools:
                    service_kwargs["tools"] = mcp_tools

                async for chunk in service.stream_chat(**service_kwargs):
                    if chunk.error:
                        await manager.send_json(session_id, {
                            "type": "error",
                            "error": chunk.error,
                        })
                        break

                    # Handle tool calls
                    if chunk.has_tool_calls and chunk.tool_calls:
                        tool_results = []
                        for tc in chunk.tool_calls:
                            # Parse server_id and tool_name
                            parsed = parse_mcp_tool_call(tc.function_name)
                            if not parsed:
                                logger.warning(f"Unknown tool call format: {tc.function_name}")
                                continue

                            server_id, tool_name = parsed
                            server_config = server_configs.get(server_id)

                            # Notify client about tool call
                            await manager.send_json(session_id, format_tool_call_message(
                                server_name=server_config.name if server_config else server_id,
                                tool_name=tool_name,
                                status="calling"
                            ))

                            # Execute the tool
                            try:
                                # Parse arguments from JSON string
                                arguments = json.loads(tc.function_arguments) if isinstance(tc.function_arguments, str) else tc.function_arguments
                                result = await mcp_service.call_tool(server_id, tool_name, arguments)

                                # Notify client about result
                                await manager.send_json(session_id, format_tool_call_message(
                                    server_name=server_config.name if server_config else server_id,
                                    tool_name=tool_name,
                                    status="success" if result.success else "error",
                                    result=result.content if result.success else None,
                                    error=result.error if not result.success else None
                                ))

                                tool_results.append(build_tool_result_message(
                                    tool_call_id=tc.id,
                                    content=result.content if result.success else f"Error: {result.error}"
                                ))

                            except Exception as e:
                                logger.error(f"Tool execution failed: {e}")
                                await manager.send_json(session_id, format_tool_call_message(
                                    server_name=server_config.name if server_config else server_id,
                                    tool_name=tool_name,
                                    status="error",
                                    error=str(e)
                                ))
                                tool_results.append(build_tool_result_message(
                                    tool_call_id=tc.id,
                                    content=f"Error: {str(e)}"
                                ))

                        # If we have tool results, continue the conversation
                        if tool_results:
                            # Add assistant message with tool calls to history
                            assistant_tool_msg = {
                                "role": "assistant",
                                "content": None,
                                "tool_calls": [
                                    {
                                        "id": tc.id,
                                        "type": "function",
                                        "function": {
                                            "name": tc.function_name,
                                            "arguments": tc.function_arguments
                                        }
                                    }
                                    for tc in chunk.tool_calls
                                    if parse_mcp_tool_call(tc.function_name)
                                ]
                            }
                            extended_history = history + [assistant_tool_msg] + tool_results

                            # Continue streaming with tool results
                            service_kwargs["messages"] = extended_history
                            service_kwargs["tools"] = mcp_tools  # Keep tools available

                            async for cont_chunk in service.stream_chat(**service_kwargs):
                                if cont_chunk.error:
                                    await manager.send_json(session_id, {
                                        "type": "error",
                                        "error": cont_chunk.error,
                                    })
                                    break

                                if cont_chunk.is_done:
                                    if full_response:
                                        await save_message(db, session_id, "assistant", full_response)
                                    await manager.send_json(session_id, {
                                        "type": "stream_end",
                                        "session_id": session_id,
                                    })
                                elif cont_chunk.content:
                                    full_response += cont_chunk.content
                                    await manager.send_json(session_id, {
                                        "type": "stream_chunk",
                                        "content": cont_chunk.content,
                                    })
                        continue

                    if chunk.is_done:
                        # Save the complete assistant response with model_id
                        if full_response:
                            await save_message(
                                db, session_id, "assistant", full_response,
                                model_id=request_model
                            )
                        await manager.send_json(session_id, {
                            "type": "stream_end",
                            "session_id": session_id,
                        })
                    elif chunk.content:
                        full_response += chunk.content
                        await manager.send_json(session_id, {
                            "type": "stream_chunk",
                            "content": chunk.content,
                        })

            except Exception as e:
                logger.error(f"Error during streaming: {e}")
                await manager.send_json(session_id, {
                    "type": "error",
                    "error": f"AI 响应出错: {str(e)}",
                })

    except WebSocketDisconnect:
        manager.disconnect(session_id)
        logger.info(f"WebSocket disconnected: {session_id}")

    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        manager.disconnect(session_id)


@router.get("/{session_id}/messages")
async def get_messages(
    session_id: str,
    db: AsyncSession = Depends(get_db_session),
    limit: int = 50,
    offset: int = 0,
):
    """Get message history for a session."""
    result = await db.execute(
        select(MessageModel)
        .where(MessageModel.session_id == session_id)
        .order_by(MessageModel.created_at.asc())
        .offset(offset)
        .limit(limit)
    )
    messages = result.scalars().all()
    return {
        "messages": [
            {
                "id": m.id,
                "role": m.role,
                "content": m.content,
                "images": json.loads(m.images) if m.images else None,
                "files": json.loads(m.files) if m.files else None,
                "model_id": m.model_id,
                "regenerated_from": m.regenerated_from,
                "regenerated_at": m.regenerated_at.isoformat() if m.regenerated_at else None,
                "created_at": m.created_at.isoformat(),
            }
            for m in messages
        ]
    }


@router.put("/{session_id}/messages/{message_id}")
async def update_message(
    session_id: str,
    message_id: str,
    content: str,
    delete_after: bool = False,
    db: AsyncSession = Depends(get_db_session),
):
    """Update a message's content.

    Args:
        session_id: Session ID
        message_id: Message ID to update
        content: New content
        delete_after: If True, delete all messages after this one (for edit-and-resend feature)
    """
    result = await db.execute(
        select(MessageModel)
        .where(MessageModel.id == message_id)
        .where(MessageModel.session_id == session_id)
    )
    message = result.scalar_one_or_none()

    if not message:
        return {"error": "Message not found"}

    message.content = content

    # Delete all messages after this one if requested (TASK-196)
    if delete_after:
        await db.execute(
            sql_delete(MessageModel)
            .where(MessageModel.session_id == session_id)
            .where(MessageModel.created_at > message.created_at)
        )
        logger.info(f"Edit message: deleted messages after {message_id}")

    await db.commit()
    await db.refresh(message)

    return {
        "id": message.id,
        "session_id": message.session_id,
        "role": message.role,
        "content": message.content,
        "created_at": message.created_at.isoformat(),
    }


@router.delete("/{session_id}/messages/{message_id}")
async def delete_message(
    session_id: str,
    message_id: str,
    db: AsyncSession = Depends(get_db_session),
):
    """Delete a message from a session."""
    from fastapi import HTTPException

    result = await db.execute(
        select(MessageModel)
        .where(MessageModel.id == message_id)
        .where(MessageModel.session_id == session_id)
    )
    message = result.scalar_one_or_none()

    if not message:
        raise HTTPException(status_code=404, detail="Message not found")

    await db.delete(message)
    await db.commit()

    return {"status": "deleted", "message_id": message_id}
