"""
Vercel Serverless Function entry point.

Wraps the FastAPI app so Vercel can route /api/* requests to it.
"""

from app.api import app  # noqa: F401 — Vercel picks up `app` automatically
