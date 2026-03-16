"""
Tests for session tags API.
"""
import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_add_tag_to_session(client: AsyncClient):
    """Test adding a tag to a session."""
    # First create a session
    session_response = await client.post("/api/sessions/", json={"source": "main"})
    assert session_response.status_code == 200
    session_id = session_response.json()["id"]

    # Add a tag
    tag_response = await client.post(
        f"/api/sessions/{session_id}/tags",
        json={"session_id": session_id, "tag_name": "important"}
    )
    assert tag_response.status_code == 200
    data = tag_response.json()
    assert data["tag_name"] == "important"
    assert data["session_id"] == session_id


@pytest.mark.asyncio
async def test_get_session_tags(client: AsyncClient):
    """Test getting tags for a session."""
    # Create session and add tags
    session_response = await client.post("/api/sessions/", json={"source": "main"})
    session_id = session_response.json()["id"]

    await client.post(
        f"/api/sessions/{session_id}/tags",
        json={"session_id": session_id, "tag_name": "work"}
    )
    await client.post(
        f"/api/sessions/{session_id}/tags",
        json={"session_id": session_id, "tag_name": "urgent"}
    )

    # Get tags
    tags_response = await client.get(f"/api/sessions/{session_id}/tags")
    assert tags_response.status_code == 200
    data = tags_response.json()
    assert data["session_id"] == session_id
    assert set(data["tags"]) == {"urgent", "work"}


@pytest.mark.asyncio
async def test_batch_get_session_tags(client: AsyncClient):
    """Test batch getting tags for multiple sessions."""
    # Create multiple sessions with tags
    session_ids = []
    for i in range(3):
        session_response = await client.post("/api/sessions/", json={"source": "main"})
        session_id = session_response.json()["id"]
        session_ids.append(session_id)

        # Add tags to each session
        await client.post(
            f"/api/sessions/{session_id}/tags",
            json={"session_id": session_id, "tag_name": f"tag-{i}"}
        )

    # Batch get tags
    response = await client.get(f"/api/tags/batch?session_ids={','.join(session_ids)}")
    assert response.status_code == 200
    data = response.json()

    assert "sessions" in data
    assert len(data["sessions"]) == 3

    # Verify each session has its expected tag
    for session_tags in data["sessions"]:
        assert session_tags["session_id"] in session_ids
        # Each session should have exactly one tag
        assert len(session_tags["tags"]) == 1


@pytest.mark.asyncio
async def test_batch_get_session_tags_empty_sessions(client: AsyncClient):
    """Test batch get with no session IDs."""
    response = await client.get("/api/tags/batch?session_ids=")
    assert response.status_code == 200
    data = response.json()
    assert data["sessions"] == []


@pytest.mark.asyncio
async def test_batch_get_session_tags_sessions_without_tags(client: AsyncClient):
    """Test batch get for sessions that have no tags."""
    # Create sessions without tags
    session_ids = []
    for _ in range(2):
        session_response = await client.post("/api/sessions/", json={"source": "main"})
        session_ids.append(session_response.json()["id"])

    # Batch get tags
    response = await client.get(f"/api/tags/batch?session_ids={','.join(session_ids)}")
    assert response.status_code == 200
    data = response.json()

    # Each session should have empty tags list
    for session_tags in data["sessions"]:
        assert session_tags["tags"] == []


@pytest.mark.asyncio
async def test_batch_get_session_tags_max_limit(client: AsyncClient):
    """Test that batch endpoint rejects requests with too many session IDs."""
    # Create 501 fake session IDs
    fake_ids = [f"fake-id-{i}" for i in range(501)]

    response = await client.get(f"/api/tags/batch?session_ids={','.join(fake_ids)}")
    assert response.status_code == 400
    assert "500" in response.json()["detail"]


@pytest.mark.asyncio
async def test_remove_tag_from_session(client: AsyncClient):
    """Test removing a tag from a session."""
    # Create session and add tag
    session_response = await client.post("/api/sessions/", json={"source": "main"})
    session_id = session_response.json()["id"]

    await client.post(
        f"/api/sessions/{session_id}/tags",
        json={"session_id": session_id, "tag_name": "temporary"}
    )

    # Verify tag exists
    tags_response = await client.get(f"/api/sessions/{session_id}/tags")
    assert "temporary" in tags_response.json()["tags"]

    # Remove tag
    delete_response = await client.delete(f"/api/sessions/{session_id}/tags/temporary")
    assert delete_response.status_code == 200

    # Verify tag is removed
    tags_response = await client.get(f"/api/sessions/{session_id}/tags")
    assert "temporary" not in tags_response.json()["tags"]


@pytest.mark.asyncio
async def test_list_all_tags(client: AsyncClient):
    """Test listing all unique tags."""
    # Create sessions with tags
    session_response = await client.post("/api/sessions/", json={"source": "main"})
    session_id = session_response.json()["id"]

    await client.post(
        f"/api/sessions/{session_id}/tags",
        json={"session_id": session_id, "tag_name": "unique-tag"}
    )

    # List all tags
    response = await client.get("/api/tags")
    assert response.status_code == 200
    tags = response.json()
    assert "unique-tag" in tags


@pytest.mark.asyncio
async def test_duplicate_tag_prevention(client: AsyncClient):
    """Test that duplicate tags on the same session are prevented."""
    # Create session
    session_response = await client.post("/api/sessions/", json={"source": "main"})
    session_id = session_response.json()["id"]

    # Add tag first time
    response1 = await client.post(
        f"/api/sessions/{session_id}/tags",
        json={"session_id": session_id, "tag_name": "duplicate-test"}
    )
    assert response1.status_code == 200

    # Try to add same tag again
    response2 = await client.post(
        f"/api/sessions/{session_id}/tags",
        json={"session_id": session_id, "tag_name": "duplicate-test"}
    )
    assert response2.status_code == 400
    assert "already exists" in response2.json()["detail"].lower()
