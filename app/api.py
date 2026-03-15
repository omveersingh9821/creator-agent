"""
FastAPI Server for Creator Agent.

Exposes the LangChain agent over HTTP so it can be consumed by the React UI.
Run with:
    uvicorn app.api:app --reload
"""

import sys
from typing import Dict, Any, Optional

from fastapi import FastAPI, HTTPException  # pyre-ignore[21]
from fastapi.middleware.cors import CORSMiddleware  # pyre-ignore[21]
from pydantic import BaseModel  # pyre-ignore[21]

from app.agent.agent import create_agent  # pyre-ignore[21]


# ── App Init ─────────────────────────────────────────────────────────────────

app = FastAPI(
    title="Creator Agent API",
    description="API to generate Instagram content via LangChain.",
    version="1.0.0",
)

# Allow frontend requests from typical Vite dev server ports
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Global Agent State ───────────────────────────────────────────────────────
# Initialize agent lazily to handle missing config keys gracefully
try:
    agent_executor = create_agent()
except ValueError as e:
    print(f"Warning: Could not initialize agent on startup: {e}")
    agent_executor = None


# ── Models ───────────────────────────────────────────────────────────────────

class GenerateRequest(BaseModel):
    topic: str


class GenerateResponse(BaseModel):
    # Depending on agent output structure, we might need to parse sections later
    # For now, it returns the full Markdown string
    result: str


# ── Endpoints ────────────────────────────────────────────────────────────────

@app.post("/api/generate", response_model=GenerateResponse)
async def generate_content(request: GenerateRequest) -> GenerateResponse:
    """Run the Creator Agent on the given topic."""
    
    # Check if agent initialized properly
    global agent_executor
    if agent_executor is None:
        try:
            agent_executor = create_agent()
        except ValueError as e:
            raise HTTPException(status_code=500, detail=f"Configuration Error: {e}")

    try:
        response: Dict[str, Any] = agent_executor.invoke({"input": request.topic})
        output = str(response.get("output", "No output generated."))
        return GenerateResponse(result=output)
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/health")
async def health_check() -> Dict[str, str]:
    """Basic health check endpoint."""
    return {"status": "ok"}


# ── Structured Content Models ────────────────────────────────────────────────

class StructuredContentResponse(BaseModel):  # pyre-ignore[11]
    """Typed response for the PostPilot AI frontend."""
    caption: str
    hashtags: list[str]
    reel_script: str
    image_idea: str
    blog: str


# ── Structured Content Endpoint ──────────────────────────────────────────────

from app.tools.caption_tool import generate_caption  # pyre-ignore[21]
from app.tools.hashtag_tool import generate_hashtags  # pyre-ignore[21]
from app.tools.reel_tool import generate_reel_script  # pyre-ignore[21]
from app.tools.image_idea_tool import generate_image_idea  # pyre-ignore[21]
from app.tools.research_tool import research_trending_topics  # pyre-ignore[21]


@app.post("/api/generate-content", response_model=StructuredContentResponse)
async def generate_structured_content(
    request: GenerateRequest,
) -> StructuredContentResponse:
    """Generate structured Instagram content by calling each tool individually.

    Returns separate fields for caption, hashtags, reel script, image idea,
    and a synthesised blog post so the frontend can render typed cards.
    """
    try:
        # 1. Call each tool directly with the user's topic
        caption_text: str = generate_caption.invoke(request.topic)
        hashtags_text: str = generate_hashtags.invoke(request.topic)
        reel_text: str = generate_reel_script.invoke(request.topic)
        image_text: str = generate_image_idea.invoke(request.topic)

        # 2. Generate a short blog post using the LLM directly
        from app.core.llm_factory import get_llm  # pyre-ignore[21]
        llm = get_llm()
        blog_result = llm.invoke(
            f"Write a short, engaging blog post (200-300 words) about: {request.topic}. "
            "Use a friendly, conversational tone. Return only the blog text."
        )
        blog_text = str(blog_result.content) if hasattr(blog_result, "content") else str(blog_result)

        # 3. Parse hashtags into a list
        hashtag_list = [
            tag.strip()
            for tag in hashtags_text.replace(",", "\n").split("\n")
            if tag.strip().startswith("#")
        ]

        return StructuredContentResponse(
            caption=caption_text.strip(),
            hashtags=hashtag_list,
            reel_script=reel_text.strip(),
            image_idea=image_text.strip(),
            blog=blog_text.strip(),
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ── MongoDB persistence ──────────────────────────────────────────────────────

from app.db.mongodb import (  # pyre-ignore[21]
    increment_global_usage,
    save_user_request,
    save_user_result,
    get_global_usage,
    get_user_requests,
    get_user_results,
)


class GenerateContentRequest(BaseModel):
    topic: str
    uid: Optional[str] = None
    email: Optional[str] = None
    display_name: Optional[str] = None


@app.post("/api/generate-content-v2", response_model=StructuredContentResponse)
async def generate_structured_content_v2(
    request: GenerateContentRequest,
) -> StructuredContentResponse:
    """Generate structured content AND persist usage/results to MongoDB."""
    try:
        caption_text: str = generate_caption.invoke(request.topic)
        hashtags_text: str = generate_hashtags.invoke(request.topic)
        reel_text: str = generate_reel_script.invoke(request.topic)
        image_text: str = generate_image_idea.invoke(request.topic)

        from app.core.llm_factory import get_llm  # pyre-ignore[21]
        llm = get_llm()
        blog_result = llm.invoke(
            f"Write a short, engaging blog post (200-300 words) about: {request.topic}. "
            "Use a friendly, conversational tone. Return only the blog text."
        )
        blog_text = str(blog_result.content) if hasattr(blog_result, "content") else str(blog_result)

        hashtag_list = [
            tag.strip()
            for tag in hashtags_text.replace(",", "\n").split("\n")
            if tag.strip().startswith("#")
        ]

        # ── Save to MongoDB ──
        try:
            await increment_global_usage(tokens_used=1250)

            if request.uid:
                await save_user_request(
                    uid=request.uid,
                    topic=request.topic,
                    email=request.email or "",
                    display_name=request.display_name or "",
                )
                await save_user_result(
                    uid=request.uid,
                    result={
                        "topic": request.topic,
                        "caption": caption_text.strip(),
                        "hashtags": hashtag_list,
                        "reel_script": reel_text.strip(),
                        "image_idea": image_text.strip(),
                        "blog": blog_text.strip(),
                    },
                )
        except Exception as db_err:
            print(f"Warning: MongoDB save failed: {db_err}")

        return StructuredContentResponse(
            caption=caption_text.strip(),
            hashtags=hashtag_list,
            reel_script=reel_text.strip(),
            image_idea=image_text.strip(),
            blog=blog_text.strip(),
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ── MongoDB Read Endpoints ───────────────────────────────────────────────────

@app.get("/api/usage")
async def api_usage() -> Dict[str, Any]:
    """Return global usage stats."""
    try:
        return await get_global_usage()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/user/{uid}/requests")
async def api_user_requests(uid: str) -> Dict[str, Any]:
    """Return recent requests for a user."""
    try:
        return await get_user_requests(uid)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/user/{uid}/results")
async def api_user_results(uid: str) -> Dict[str, Any]:
    """Return recent 5 results for a user."""
    try:
        return await get_user_results(uid)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

