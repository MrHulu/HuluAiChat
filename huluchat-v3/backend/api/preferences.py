"""
Preferences API - Model preference learning endpoints

Privacy-first: All data stored locally, never uploaded.
"""
from fastapi import APIRouter
from pydantic import BaseModel
from typing import List, Optional

from services.preference_service import (
    record_model_usage,
    get_model_usage_stats,
    get_recommended_model,
    clear_preferences,
)

router = APIRouter()


class ModelUsageRequest(BaseModel):
    """Request to record model usage"""
    model_id: str


class ModelUsageStatsResponse(BaseModel):
    """Response for model usage statistics"""
    model_id: str
    count: int
    last_used: Optional[str] = None


class RecommendedModelRequest(BaseModel):
    """Request to get recommended model"""
    available_models: List[str]


class RecommendedModelResponse(BaseModel):
    """Response for recommended model"""
    model_id: Optional[str]
    reason: str


@router.post("/model-usage", response_model=ModelUsageStatsResponse)
async def record_model_usage_endpoint(request: ModelUsageRequest):
    """
    Record model usage for preference learning.

    This endpoint is called when a user selects a model.
    """
    record_model_usage(request.model_id)

    # Return updated stats
    stats = get_model_usage_stats()
    for stat in stats:
        if stat.model_id == request.model_id:
            return ModelUsageStatsResponse(
                model_id=stat.model_id,
                count=stat.count,
                last_used=stat.last_used
            )

    return ModelUsageStatsResponse(
        model_id=request.model_id,
        count=1,
        last_used=None
    )


@router.get("/model-usage", response_model=List[ModelUsageStatsResponse])
async def get_model_usage_endpoint():
    """
    Get model usage statistics sorted by frequency.
    """
    stats = get_model_usage_stats()
    return [
        ModelUsageStatsResponse(
            model_id=stat.model_id,
            count=stat.count,
            last_used=stat.last_used
        )
        for stat in stats
    ]


@router.post("/recommended-model", response_model=RecommendedModelResponse)
async def get_recommended_model_endpoint(request: RecommendedModelRequest):
    """
    Get recommended model based on usage frequency.

    Returns the most frequently used model that is still available.
    """
    recommended = get_recommended_model(request.available_models)

    if recommended:
        return RecommendedModelResponse(
            model_id=recommended,
            reason="Most frequently used model"
        )

    return RecommendedModelResponse(
        model_id=None,
        reason="No usage data available"
    )


@router.delete("/model-usage")
async def clear_preferences_endpoint():
    """
    Clear all preference data.
    """
    clear_preferences()
    return {"status": "success", "message": "Preferences cleared"}
