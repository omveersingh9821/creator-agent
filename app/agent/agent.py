"""
Agent module — assembles the LangChain structured-chat agent.

Uses `create_structured_chat_agent` + `AgentExecutor` (the modern API)
which is the supported replacement for the legacy
`structured-chat-zero-shot-react-description` agent type.
"""

from langchain.agents import AgentExecutor, create_tool_calling_agent  # pyre-ignore[21]
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder  # pyre-ignore[21]

from app.config.settings import AGENT_MAX_ITERATIONS, VERBOSE  # pyre-ignore[21]
from app.core.llm_factory import get_llm  # pyre-ignore[21]
from app.prompts.prompts import AGENT_SYSTEM_PROMPT  # pyre-ignore[21]

# ── Import all tools ─────────────────────────────────────────────────────────
from app.tools.caption_tool import generate_caption  # pyre-ignore[21]
from app.tools.hashtag_tool import generate_hashtags  # pyre-ignore[21]
from app.tools.image_idea_tool import generate_image_idea  # pyre-ignore[21]
from app.tools.reel_tool import generate_reel_script  # pyre-ignore[21]
from app.tools.research_tool import research_trending_topics  # pyre-ignore[21]


def _build_prompt() -> ChatPromptTemplate:
    """Build the tool-calling prompt template.

    The prompt includes the system message, a placeholder for chat history,
    the human input, and a scratchpad for agent reasoning steps (tool calls).
    """
    return ChatPromptTemplate.from_messages(
        [
            ("system", AGENT_SYSTEM_PROMPT),
            MessagesPlaceholder(variable_name="chat_history", optional=True),
            ("human", "{input}"),
            MessagesPlaceholder(variable_name="agent_scratchpad"),
        ]
    )


def create_agent() -> AgentExecutor:
    """Create and return a fully configured Creator Agent.

    Returns:
        An AgentExecutor ready to be invoked with user input.
    """
    llm = get_llm()

    tools = [
        research_trending_topics,
        generate_caption,
        generate_hashtags,
        generate_reel_script,
        generate_image_idea,
    ]

    prompt = _build_prompt()

    agent = create_tool_calling_agent(
        llm=llm,
        tools=tools,
        prompt=prompt,
    )

    return AgentExecutor(
        agent=agent,
        tools=tools,
        verbose=VERBOSE,
        max_iterations=AGENT_MAX_ITERATIONS,
        handle_parsing_errors=True,
        return_intermediate_steps=False,
    )
