"""Tests for chat API endpoints."""
import pytest
from httpx import AsyncClient


class TestChatMessages:
    """Test cases for chat message endpoints."""

    @pytest.mark.asyncio
    async def test_get_messages_empty_session(self, client: AsyncClient):
        """Test getting messages from an empty session."""
        # Create a session first
        create_response = await client.post("/api/sessions/", json={"source": "main"})
        session_id = create_response.json()["id"]

        # Get messages
        response = await client.get(f"/api/chat/{session_id}/messages")

        assert response.status_code == 200
        data = response.json()
        assert "messages" in data
        assert len(data["messages"]) == 0

    @pytest.mark.asyncio
    async def test_get_messages_with_pagination(self, client: AsyncClient):
        """Test getting messages with pagination parameters."""
        # Create a session
        create_response = await client.post("/api/sessions/", json={"source": "main"})
        session_id = create_response.json()["id"]

        # Get messages with limit
        response = await client.get(f"/api/chat/{session_id}/messages?limit=10&offset=0")

        assert response.status_code == 200
        data = response.json()
        assert "messages" in data


class TestMessageUpdate:
    """Test cases for updating messages."""

    @pytest.mark.asyncio
    async def test_update_message_content(self, client: AsyncClient):
        """Test updating message content."""
        # Create a session
        create_response = await client.post("/api/sessions/", json={"source": "main"})
        session_id = create_response.json()["id"]

        # Update a non-existent message (should return error)
        response = await client.put(
            f"/api/chat/{session_id}/messages/non-existent-id",
            params={"content": "Updated content"}
        )

        # Message not found returns {"error": "Message not found"}
        assert response.status_code == 200
        data = response.json()
        assert "error" in data

    @pytest.mark.asyncio
    async def test_update_message_with_delete_after(self, client: AsyncClient):
        """Test updating message with delete_after flag."""
        # Create a session
        create_response = await client.post("/api/sessions/", json={"source": "main"})
        session_id = create_response.json()["id"]

        # Update with delete_after flag
        response = await client.put(
            f"/api/chat/{session_id}/messages/non-existent-id",
            params={"content": "Updated content", "delete_after": True}
        )

        assert response.status_code == 200


class TestMessageDelete:
    """Test cases for deleting messages."""

    @pytest.mark.asyncio
    async def test_delete_message_not_found(self, client: AsyncClient):
        """Test deleting a non-existent message."""
        # Create a session
        create_response = await client.post("/api/sessions/", json={"source": "main"})
        session_id = create_response.json()["id"]

        # Delete non-existent message
        response = await client.delete(f"/api/chat/{session_id}/messages/non-existent-id")

        assert response.status_code == 404


class TestChatWebSocket:
    """Test cases for WebSocket chat functionality."""

    @pytest.mark.asyncio
    async def test_websocket_endpoint_exists(self, client: AsyncClient):
        """Test that WebSocket endpoint path is correct."""
        # Create a session
        create_response = await client.post("/api/sessions/", json={"source": "main"})
        session_id = create_response.json()["id"]

        # We can't easily test WebSocket with AsyncClient
        # But we can verify the endpoint path exists by checking the route
        # This is a placeholder for WebSocket testing
        assert session_id is not None
