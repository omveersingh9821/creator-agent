"""
Reel Script Tool — generates short Instagram Reel scripts via the configured LLM.
"""

from langchain_core.tools import tool  # pyre-ignore[21]

from app.core.llm_factory import get_llm  # pyre-ignore[21]
from app.prompts.prompts import REEL_SCRIPT_PROMPT  # pyre-ignore[21]


@tool
def generate_reel_script(topic: str) -> str:
    """Generate a short, punchy Instagram Reel script for the given topic.

    The script is designed for 30-60 seconds, includes scene markers,
    on-screen text suggestions, and a strong opening hook.

    Args:
        topic: The subject of the Instagram reel.

    Returns:
        A formatted reel script ready for production.
    """
    llm = get_llm()
    prompt = REEL_SCRIPT_PROMPT.format(topic=topic)
    response = llm.invoke(prompt)
    return str(response.content)
