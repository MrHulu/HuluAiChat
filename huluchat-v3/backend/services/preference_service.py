"""
Preference Service - Local preference learning for model recommendations

Privacy-first: All data stored locally, never uploaded.
"""
import json
from pathlib import Path
from typing import Dict, List, Optional
from datetime import datetime
from pydantic import BaseModel
from collections import Counter


# Preference file path
PREFERENCE_FILE = Path(__file__).parent.parent / "user_preferences.json"


class ModelUsageStats(BaseModel):
    """Model usage statistics"""
    model_id: str
    count: int = 0
    last_used: Optional[str] = None


class PreferenceData(BaseModel):
    """User preference data"""
    model_usage: Dict[str, int] = {}  # model_id -> count
    last_used_models: Dict[str, str] = {}  # model_id -> timestamp


def load_preferences() -> PreferenceData:
    """Load user preferences from file"""
    if PREFERENCE_FILE.exists():
        try:
            with open(PREFERENCE_FILE, "r", encoding="utf-8") as f:
                data = json.load(f)
                return PreferenceData(**data)
        except Exception:
            return PreferenceData()
    return PreferenceData()


def save_preferences(prefs: PreferenceData) -> None:
    """Save user preferences to file"""
    with open(PREFERENCE_FILE, "w", encoding="utf-8") as f:
        json.dump(prefs.model_dump(), f, indent=2)


def record_model_usage(model_id: str) -> None:
    """Record model usage for preference learning"""
    prefs = load_preferences()

    # Increment usage count
    if model_id not in prefs.model_usage:
        prefs.model_usage[model_id] = 0
    prefs.model_usage[model_id] += 1

    # Update last used timestamp
    prefs.last_used_models[model_id] = datetime.utcnow().isoformat()

    save_preferences(prefs)


def get_model_usage_stats() -> List[ModelUsageStats]:
    """Get model usage statistics sorted by count (descending)"""
    prefs = load_preferences()

    stats = []
    for model_id, count in prefs.model_usage.items():
        last_used = prefs.last_used_models.get(model_id)
        stats.append(ModelUsageStats(
            model_id=model_id,
            count=count,
            last_used=last_used
        ))

    # Sort by count descending
    stats.sort(key=lambda x: x.count, reverse=True)
    return stats


def get_recommended_model(available_models: List[str]) -> Optional[str]:
    """
    Get recommended model based on usage frequency.

    Args:
        available_models: List of available model IDs

    Returns:
        Most frequently used model that is still available, or None
    """
    prefs = load_preferences()

    if not prefs.model_usage:
        return None

    # Filter to only available models and sort by usage count
    available_set = set(available_models)
    filtered_usage = {
        model_id: count
        for model_id, count in prefs.model_usage.items()
        if model_id in available_set
    }

    if not filtered_usage:
        return None

    # Return the most used model
    return max(filtered_usage.items(), key=lambda x: x[1])[0]


def clear_preferences() -> None:
    """Clear all preference data"""
    if PREFERENCE_FILE.exists():
        PREFERENCE_FILE.unlink()
