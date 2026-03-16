"""
Centralized application settings.

All configuration is loaded from environment variables (via .env file)
so that secrets never appear in source code.
"""

import os
from pathlib import Path

from dotenv import load_dotenv  # pyre-ignore[21]

# ── Load .env from the project root ──────────────────────────────────────────
_PROJECT_ROOT = Path(__file__).resolve().parents[2]
load_dotenv(_PROJECT_ROOT / ".env")


# ── LLM Provider ─────────────────────────────────────────────────────────────
# Supported values: "gemini", "openai", "anthropic"
LLM_PROVIDER: str = (os.getenv("LLM_PROVIDER") or "gemini").lower()

# ── API Keys ──────────────────────────────────────────────────────────────────
GOOGLE_API_KEY: str = os.getenv("GOOGLE_API_KEY") or ""
OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY") or ""
ANTHROPIC_API_KEY: str = os.getenv("ANTHROPIC_API_KEY") or ""

# ── Model Parameters ─────────────────────────────────────────────────────────
MODEL_NAME: str = os.getenv("MODEL_NAME") or "gemini-2.0-flash"
TEMPERATURE: float = float(os.getenv("TEMPERATURE") or "0.7")

# ── Agent Settings ────────────────────────────────────────────────────────────
AGENT_MAX_ITERATIONS: int = int(os.getenv("AGENT_MAX_ITERATIONS") or "10")
VERBOSE: bool = (os.getenv("VERBOSE") or "true").lower() == "true"

# ── Database ──────────────────────────────────────────────────────────────────
MONGODB_URI: str = os.getenv("MONGODB_URI") or ""

