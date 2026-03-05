"""Chat API with WebSocket streaming."""
import uuid
import json
import logging
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from core.database import get_session as get_db_session
from models.schemas import MessageModel
from services.openai_service import openai_service
from services.ollama_service import ollama_service

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
    """Get message history for a session."""
    result = await db.execute(
        select(MessageModel)
        .where(MessageModel.session_id == session_id)
        .order_by(MessageModel.created_at.asc())
        .limit(limit)
    )
    messages = result.scalars().all()
    return [{"role": m.role, "content": m.content} for m in messages]


async def save_message(
    db: AsyncSession,
    session_id: str,
    role: str,
    content: str
) -> MessageModel:
    """Save a message to the database."""
    message = MessageModel(
        id=str(uuid.uuid4()),
        session_id=session_id,
        role=role,
        content=content,
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
            # Get model from client, or use default
            request_model = data.get("model")

            if not user_content.strip():
                continue

            # Save user message
            await save_message(db, session_id, "user", user_content)

            # Notify client that streaming is starting
            await manager.send_json(session_id, {
                "type": "stream_start",
                "session_id": session_id,
            })

            # Get conversation history for context
            history = await get_session_messages(db, session_id, limit=20)

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

            # Stream AI response
            full_response = ""
            try:
                async for chunk in service.stream_chat(history, model=model_name):
                    if chunk.error:
                        await manager.send_json(session_id, {
                            "type": "error",
                            "content": chunk.error,
                        })
                        break

                    if chunk.is_done:
                        # Save the complete assistant response
                        if full_response:
                            await save_message(db, session_id, "assistant", full_response)
                        await manager.send_json(session_id, {
                            "type": "stream_end",
                            "session_id": session_id,
                        })
                    else:
                        full_response += chunk.content
                        await manager.send_json(session_id, {
                            "type": "stream_chunk",
                            "content": chunk.content,
                        })

            except Exception as e:
                logger.error(f"Error during streaming: {e}")
                await manager.send_json(session_id, {
                    "type": "error",
                    "content": f"AI 响应出错: {str(e)}",
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
                "created_at": m.created_at.isoformat(),
            }
            for m in messages
        ]
    }
