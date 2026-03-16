"""
Agent module — assembles the LangChain structured-chat agent.

Uses `create_structured_chat_agent` + `AgentExecutor` (the modern API)
which is the supported replacement for the legacy
`structured-chat-zero-shot-react-description` agent type.
"""

from langgraph.prebuilt import create_react_agent  # pyre-ignore[21]
from langchain_core.prompts import ChatPromptTemplate  # pyre-ignore[21]

from app.config.settings import VERBOSE  # pyre-ignore[21]
from app.core.llm_factory import get_llm  # pyre-ignore[21]
from app.prompts.prompts import AGENT_SYSTEM_PROMPT  # pyre-ignore[21]

# ── Import all tools ─────────────────────────────────────────────────────────
from app.tools.caption_tool import generate_caption  # pyre-ignore[21]
from app.tools.hashtag_tool import generate_hashtags  # pyre-ignore[21]
from app.tools.image_idea_tool import generate_image_idea  # pyre-ignore[21]
from app.tools.reel_tool import generate_reel_script  # pyre-ignore[21]
from app.tools.research_tool import research_trending_topics  # pyre-ignore[21]


def create_agent():
    """Create and return a fully configured Creator Agent using LangGraph.

    Returns:
        A compiled LangGraph ready to be invoked.
    """
    llm = get_llm()

    tools = [
        research_trending_topics,
        generate_caption,
        generate_hashtags,
        generate_reel_script,
        generate_image_idea,
    ]

    # LangGraph's prebuilt react agent uses prompt for the system message on this environment
    return create_react_agent(
        model=llm,
        tools=tools,
        prompt=AGENT_SYSTEM_PROMPT,
        debug=VERBOSE,
    )
