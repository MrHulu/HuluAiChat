"""Tests for sessions API endpoints."""
import pytest
from httpx import AsyncClient


class TestSessionsList:
    """Test cases for listing sessions."""

    @pytest.mark.asyncio
    async def test_list_sessions_empty(self, client: AsyncClient):
        """Test listing sessions when none exist."""
        response = await client.get("/api/sessions/")

        assert response.status_code == 200
        data = response.json()
        # API 返回分页格式: {"sessions": [...], "total": 0, "limit": 50, "offset": 0, "has_more": false}
        assert isinstance(data, dict)
        assert "sessions" in data
        assert data["sessions"] == []
        assert data["total"] == 0
        assert data["has_more"] is False

    @pytest.mark.asyncio
    async def test_list_sessions_with_data(self, client: AsyncClient):
        """Test listing sessions after creating one."""
        # Create a session first
        create_response = await client.post("/api/sessions/", json={"source": "main"})
        assert create_response.status_code == 200

        # List sessions
        response = await client.get("/api/sessions/")

        assert response.status_code == 200
        data = response.json()
        # API 返回分页格式
        assert isinstance(data, dict)
        assert "sessions" in data
        assert len(data["sessions"]) == 1
        assert data["total"] == 1

    @pytest.mark.asyncio
    async def test_list_sessions_filter_by_source(self, client: AsyncClient):
        """Test filtering sessions by source."""
        # Create sessions with different sources
        await client.post("/api/sessions/", json={"source": "main"})
        await client.post("/api/sessions/", json={"source": "quickpanel"})

        # Filter by main source
        response = await client.get("/api/sessions/?source=main")

        assert response.status_code == 200
        data = response.json()
        assert len(data["sessions"]) == 1
        assert data["sessions"][0]["source"] == "main"


class TestSessionCreate:
    """Test cases for creating sessions."""

    @pytest.mark.asyncio
    async def test_create_session_default_source(self, client: AsyncClient):
        """Test creating a session with default source."""
        response = await client.post("/api/sessions/", json={"source": "main"})

        assert response.status_code == 200
        data = response.json()
        assert "id" in data
        assert data["title"] == "New Chat"
        assert data["source"] == "main"

    @pytest.mark.asyncio
    async def test_create_session_quickpanel_source(self, client: AsyncClient):
        """Test creating a session with quickpanel source."""
        response = await client.post("/api/sessions/", json={"source": "quickpanel"})

        assert response.status_code == 200
        data = response.json()
        assert data["source"] == "quickpanel"


class TestSessionGetDelete:
    """Test cases for getting and deleting sessions."""

    @pytest.mark.asyncio
    async def test_get_session_by_id(self, client: AsyncClient):
        """Test getting a session by ID."""
        # Create a session
        create_response = await client.post("/api/sessions/", json={"source": "main"})
        session_id = create_response.json()["id"]

        # Get the session
        response = await client.get(f"/api/sessions/{session_id}")

        assert response.status_code == 200
        data = response.json()
        assert data["id"] == session_id
        assert data["title"] == "New Chat"

    @pytest.mark.asyncio
    async def test_get_session_not_found(self, client: AsyncClient):
        """Test getting a non-existent session."""
        response = await client.get("/api/sessions/non-existent-id")

        assert response.status_code == 404

    @pytest.mark.asyncio
    async def test_delete_session(self, client: AsyncClient):
        """Test deleting a session."""
        # Create a session
        create_response = await client.post("/api/sessions/", json={"source": "main"})
        session_id = create_response.json()["id"]

        # Delete the session
        delete_response = await client.delete(f"/api/sessions/{session_id}")
        assert delete_response.status_code == 200
        assert delete_response.json()["status"] == "deleted"

        # Verify it's deleted
        get_response = await client.get(f"/api/sessions/{session_id}")
        assert get_response.status_code == 404
