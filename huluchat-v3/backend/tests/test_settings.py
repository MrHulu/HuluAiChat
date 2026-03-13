"""Tests for settings API endpoints."""
import pytest
from httpx import AsyncClient
from unittest.mock import patch, MagicMock


class TestSettingsGet:
    """Test cases for getting settings."""

    @pytest.mark.asyncio
    async def test_get_settings_default(self, client: AsyncClient):
        """Test getting default settings."""
        response = await client.get("/api/settings/")

        assert response.status_code == 200
        data = response.json()
        # Check that settings are returned
        assert "has_api_key" in data
        assert "openai_model" in data
        assert "temperature" in data

    @pytest.mark.asyncio
    async def test_get_settings_includes_model_params(self, client: AsyncClient):
        """Test that settings include model parameters."""
        response = await client.get("/api/settings/")

        assert response.status_code == 200
        data = response.json()
        assert "temperature" in data
        assert "top_p" in data
        assert "max_tokens" in data


class TestSettingsUpdate:
    """Test cases for updating settings."""

    @pytest.mark.asyncio
    async def test_update_settings_model(self, client: AsyncClient):
        """Test updating the model setting."""
        response = await client.post(
            "/api/settings/",
            json={"openai_model": "gpt-4o"}
        )

        assert response.status_code == 200
        data = response.json()
        assert data["openai_model"] == "gpt-4o"

    @pytest.mark.asyncio
    async def test_update_settings_temperature(self, client: AsyncClient):
        """Test updating temperature setting."""
        response = await client.post(
            "/api/settings/",
            json={"temperature": 0.5}
        )

        assert response.status_code == 200
        data = response.json()
        assert data["temperature"] == 0.5


class TestModelsList:
    """Test cases for listing available models."""

    @pytest.mark.asyncio
    async def test_get_models_list(self, client: AsyncClient):
        """Test getting the list of available models."""
        response = await client.get("/api/settings/models")

        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) > 0

        # Check model structure
        model = data[0]
        assert "id" in model
        assert "name" in model
        assert "description" in model
        assert "provider" in model

    @pytest.mark.asyncio
    async def test_models_list_includes_deepseek(self, client: AsyncClient):
        """Test that models list includes DeepSeek models."""
        response = await client.get("/api/settings/models")

        assert response.status_code == 200
        data = response.json()
        model_ids = [m["id"] for m in data]

        assert "deepseek-chat" in model_ids
        assert "deepseek-reasoner" in model_ids

    @pytest.mark.asyncio
    async def test_models_list_includes_openai(self, client: AsyncClient):
        """Test that models list includes OpenAI models."""
        response = await client.get("/api/settings/models")

        assert response.status_code == 200
        data = response.json()
        model_ids = [m["id"] for m in data]

        assert "gpt-4o" in model_ids
        assert "gpt-4o-mini" in model_ids
