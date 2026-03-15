"""
Caption Tool — generates engaging Instagram captions via the configured LLM.
"""

from langchain_core.tools import tool  # pyre-ignore[21]

from app.core.llm_factory import get_llm  # pyre-ignore[21]
from app.prompts.prompts import CAPTION_PROMPT  # pyre-ignore[21]


@tool
def generate_caption(topic: str) -> str:
    """Generate an engaging Instagram caption for the given topic.

    The caption will include a scroll-stopping hook, storytelling,
    a call-to-action, and natural emoji usage.

    Args:
        topic: The subject of the Instagram post (e.g. "AI automation").

    Returns:
        A ready-to-post Instagram caption.
    """
    llm = get_llm()
    prompt = CAPTION_PROMPT.format(topic=topic)
    response = llm.invoke(prompt)
    return str(response.content)
