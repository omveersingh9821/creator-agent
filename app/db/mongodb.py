"""
MongoDB async client and helper functions.

Uses Motor (async driver) so it integrates natively with FastAPI.
Collections:
  - global_usage:  single-doc aggregate stats (total requests, tokens, cost)
  - user_requests: per-user recent request topics (capped at 20)
  - user_results:  per-user recent generated results (capped at 5)
"""

from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from motor.motor_asyncio import AsyncIOMotorClient  # pyre-ignore[21]

from app.config.settings import MONGODB_URI, MODEL_NAME  # pyre-ignore[21]

# ── Model pricing (USD per 1M tokens) ────────────────────────────────────────
# Source: https://openai.com/api/pricing  (input + output averaged)
MODEL_COST_PER_1M_TOKENS: Dict[str, float] = {
    # OpenAI
    "gpt-4o": 5.0,
    "gpt-4o-mini": 0.30,
    "gpt-4-turbo": 20.0,
    "gpt-3.5-turbo": 1.0,
    # Gemini
    "gemini-2.0-flash": 0.10,
    "gemini-1.5-pro": 3.50,
    "gemini-1.5-flash": 0.075,
    # Anthropic
    "claude-3-5-sonnet-20241022": 9.0,
    "claude-3-opus-20240229": 45.0,
    "claude-3-haiku-20240307": 0.75,
}

# ── Motor client ──────────────────────────────────────────────────────────────

_client: Optional[AsyncIOMotorClient] = None
_db = None


def _get_db():
    """Lazy-initialize the Motor client and return the database handle."""
    global _client, _db
    if _db is None:
        if not MONGODB_URI:
            raise RuntimeError(
                "MONGODB_URI is not set. Add it to your .env file."
            )
        _client = AsyncIOMotorClient(MONGODB_URI)
        _db = _client.get_default_database("creator_agent")
    return _db


def _estimate_cost(tokens: int, model: str) -> float:
    """Return estimated cost in USD based on token count and model."""
    cost_per_1m = MODEL_COST_PER_1M_TOKENS.get(model, 3.0)  # fallback $3/1M
    return round(tokens * cost_per_1m / 1_000_000, 6)


# ── Global Usage ──────────────────────────────────────────────────────────────

async def increment_global_usage(tokens_used: int = 1250) -> None:
    """Increment global request count, token estimate, and cost."""
    db = _get_db()
    cost = _estimate_cost(tokens_used, MODEL_NAME)
    await db.global_usage.update_one(
        {"_id": "global"},
        {
            "$inc": {
                "total_requests": 1,
                "total_tokens_estimated": tokens_used,
                "estimated_cost_usd": cost,
            },
            "$set": {
                "model": MODEL_NAME,
                "updated_at": datetime.now(timezone.utc),
            },
        },
        upsert=True,
    )


async def get_global_usage() -> Dict[str, Any]:
    """Return the global usage document."""
    db = _get_db()
    doc = await db.global_usage.find_one({"_id": "global"})
    if doc is None:
        return {
            "total_requests": 0,
            "total_tokens_estimated": 0,
            "estimated_cost_usd": 0.0,
            "model": MODEL_NAME,
        }
    doc.pop("_id", None)
    return doc


# ── User Requests ─────────────────────────────────────────────────────────────

async def save_user_request(
    uid: str, topic: str, email: str = "", display_name: str = ""
) -> None:
    """Push a topic to the user's recent_requests (max 20)."""
    db = _get_db()
    entry = {"topic": topic, "timestamp": datetime.now(timezone.utc)}
    await db.user_requests.update_one(
        {"_id": uid},
        {
            "$push": {"recent_requests": {"$each": [entry], "$position": 0, "$slice": 20}},
            "$inc": {"total_requests": 1},
            "$set": {
                "email": email,
                "display_name": display_name,
                "updated_at": datetime.now(timezone.utc),
            },
        },
        upsert=True,
    )


async def get_user_requests(uid: str) -> Dict[str, Any]:
    """Return a user's recent requests."""
    db = _get_db()
    doc = await db.user_requests.find_one({"_id": uid})
    if doc is None:
        return {"recent_requests": [], "total_requests": 0}
    doc.pop("_id", None)
    return doc


# ── User Results ──────────────────────────────────────────────────────────────

async def save_user_result(uid: str, result: Dict[str, Any]) -> None:
    """Push a generated result to the user's recent_results (max 5)."""
    db = _get_db()
    result["created_at"] = datetime.now(timezone.utc)
    await db.user_results.update_one(
        {"_id": uid},
        {
            "$push": {"recent_results": {"$each": [result], "$position": 0, "$slice": 5}},
            "$set": {"updated_at": datetime.now(timezone.utc)},
        },
        upsert=True,
    )


async def get_user_results(uid: str) -> Dict[str, Any]:
    """Return a user's recent 5 results."""
    db = _get_db()
    doc = await db.user_results.find_one({"_id": uid})
    if doc is None:
        return {"recent_results": []}
    doc.pop("_id", None)
    return doc
