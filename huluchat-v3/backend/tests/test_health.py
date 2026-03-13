"""Tests for health API endpoints."""
import pytest
from httpx import AsyncClient


class TestHealthAPI:
    """Test cases for health check endpoints."""

    @pytest.mark.asyncio
    async def test_health_check_returns_ok(self, client: AsyncClient):
        """Test that health check endpoint returns ok status."""
        response = await client.get("/api/health")

        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "ok"
        assert "version" in data

    @pytest.mark.asyncio
    async def test_health_check_returns_version(self, client: AsyncClient):
        """Test that health check endpoint includes version info."""
        response = await client.get("/api/health")

        assert response.status_code == 200
        data = response.json()
        assert data["version"] == "3.0.0"
