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
from typing import List  # pyre-ignore[21]

# NOTE: agent import is LAZY — LangChain is imported only when needed
# so Vercel serverless cold starts stay fast for lightweight endpoints.


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
# Lazy initialization — only loads heavy LangChain modules on first generate call
_agent_executor = None


def _get_agent():
    """Lazy-load the LangChain agent on first use."""
    global _agent_executor
    if _agent_executor is None:
        try:
            from app.agent.agent import create_agent  # pyre-ignore[21]
            _agent_executor = create_agent()
        except ValueError as e:
            print(f"Warning: Could not initialize agent: {e}")
            raise HTTPException(status_code=503, detail=f"Agent not available: {e}")
    return _agent_executor


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
    executor = _get_agent()

    try:
        response: Dict[str, Any] = executor.invoke({"input": request.topic})
        output = str(response.get("output", "No output generated."))
        return GenerateResponse(result=output)
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/health")
async def health_check() -> Dict[str, str]:
    """Basic health check endpoint."""
    return {"status": "ok"}

@app.get("/api/debug-env")
async def debug_env() -> Dict[str, Any]:
    """Temporary endpoint to check env vars on Vercel."""
    import os
    return {
        "LLM_PROVIDER": os.environ.get("LLM_PROVIDER", "NOT_SET"),
        "HAS_ANTHROPIC_KEY": bool(os.environ.get("ANTHROPIC_API_KEY")),
        "HAS_OPENAI_KEY": bool(os.environ.get("OPENAI_API_KEY")),
        "HAS_GOOGLE_KEY": bool(os.environ.get("GOOGLE_API_KEY")),
        "TAVILY_API_KEY": bool(os.environ.get("TAVILY_API_KEY")),
    }


# ── Structured Content Models ────────────────────────────────────────────────

class StructuredContentResponse(BaseModel):  # pyre-ignore[11]
    """Typed response for the PostPilot AI frontend."""
    caption: str
    hashtags: list[str]
    reel_script: str
    image_idea: str
    blog: str


# ── Structured Content Endpoint ──────────────────────────────────────────────


@app.post("/api/generate-content", response_model=StructuredContentResponse)
async def generate_structured_content(
    request: GenerateRequest,
) -> StructuredContentResponse:
    """Generate structured Instagram content by calling each tool individually.

    Returns separate fields for caption, hashtags, reel script, image idea,
    and a synthesised blog post so the frontend can render typed cards.
    """
    try:
        # Lazy imports — only load LangChain tools when this endpoint is called
        from app.tools.caption_tool import generate_caption  # pyre-ignore[21]
        from app.tools.hashtag_tool import generate_hashtags  # pyre-ignore[21]
        from app.tools.reel_tool import generate_reel_script  # pyre-ignore[21]
        from app.tools.image_idea_tool import generate_image_idea  # pyre-ignore[21]

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
        # Lazy imports — only load heavy modules when this endpoint is called
        from app.tools.caption_tool import generate_caption  # pyre-ignore[21]
        from app.tools.hashtag_tool import generate_hashtags  # pyre-ignore[21]
        from app.tools.reel_tool import generate_reel_script  # pyre-ignore[21]
        from app.tools.image_idea_tool import generate_image_idea  # pyre-ignore[21]
        from app.db.mongodb import increment_global_usage, save_user_request, save_user_result  # pyre-ignore[21]

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
        from app.db.mongodb import get_global_usage  # pyre-ignore[21]
        return await get_global_usage()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/user/{uid}/requests")
async def api_user_requests(uid: str) -> Dict[str, Any]:
    """Return recent requests for a user."""
    try:
        from app.db.mongodb import get_user_requests  # pyre-ignore[21]
        return await get_user_requests(uid)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/user/{uid}/results")
async def api_user_results(uid: str) -> Dict[str, Any]:
    """Return recent 5 results for a user."""
    try:
        from app.db.mongodb import get_user_results  # pyre-ignore[21]
        return await get_user_results(uid)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ── Image Generation ─────────────────────────────────────────────────────────


class ImageGenRequest(BaseModel):
    prompt: str


class ImageGenResponse(BaseModel):
    image_base64: str
    prompt: str


# ─── Travel Pydantic Models ────────────────────────────────────────────────────────
class TravelQuery(BaseModel):
    query: str

class FlightModel(BaseModel):
    airline: str
    flight_number: str
    departure_time: str
    arrival_time: str
    duration: str
    price: int
    stops: int

class HotelModel(BaseModel):
    name: str
    stars: int
    rating: float
    price_per_night: int
    amenities: List[str]

class TravelItinerary(BaseModel):
    ai_summary: str
    flights: List[FlightModel] = []
    hotels: List[HotelModel] = []


class BookFlightRequest(BaseModel):
    flight: FlightModel

class BookFlightResponse(BaseModel):
    success: bool
    message: str
    booking_reference: str


@app.post("/api/generate-image", response_model=ImageGenResponse)
async def generate_image_endpoint(
    request: ImageGenRequest,
) -> ImageGenResponse:
    """Generate an AI image from a text prompt.

    Returns a base64-encoded PNG image along with the prompt used.
    """
    try:
        from app.tools.image_gen_tool import generate_image  # pyre-ignore[21]

        image_b64 = generate_image(request.prompt)

        return ImageGenResponse(
            image_base64=image_b64,
            prompt=request.prompt,
        )

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/agents/travel", response_model=TravelItinerary)
async def generate_travel_itinerary(request: TravelQuery):
    """
    Given a user's natural language travel query, invoke the Langchain
    Travel Agent to search for hypothetical flights and hotels and return structured JSON.
    """
    try:
        from app.agents.travel_agent import run_travel_agent

        # On Vercel, threads can cause crashes in Serverless. 
        # Since it's serverless and single-request-per-instance, we can just run it synchronously.
        result_dict = run_travel_agent(request.query)

        # Pydantic will validate this dictionary against our TravelItinerary schema
        return result_dict

    except Exception as e:
        import traceback
        err_msg = traceback.format_exc()
        print(f"TRAVEL AGENT ERROR POST-DEPLOY: {err_msg}")
        raise HTTPException(status_code=500, detail=f"Travel Agent Error: {str(e)}\n\nTraceback:\n{err_msg}")


@app.post("/api/agents/travel/book", response_model=BookFlightResponse)
async def book_flight(request: BookFlightRequest):
    """
    Mock endpoint to 'book' a flight.
    In a real app, this would integrate with an airline or GDS API.
    """
    import random
    import string
    
    # Generate a random 6-character booking reference
    booking_ref = ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))
    
    # Simulate a small delay for booking
    import asyncio
    await asyncio.sleep(1.5)
    
    return BookFlightResponse(
        success=True,
        message=f"Successfully booked flight {request.flight.airline} {request.flight.flight_number}!",
        booking_reference=booking_ref
    )
