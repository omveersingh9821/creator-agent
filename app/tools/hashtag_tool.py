"""
Hashtag Tool — generates relevant Instagram hashtags via the configured LLM.
"""

from langchain_core.tools import tool  # pyre-ignore[21]

from app.core.llm_factory import get_llm  # pyre-ignore[21]
from app.prompts.prompts import HASHTAG_PROMPT  # pyre-ignore[21]


@tool
def generate_hashtags(topic: str) -> str:
    """Generate a curated set of Instagram hashtags for the given topic.

    Returns a mix of broad, medium, and niche hashtags optimised for
    reach and discoverability.

    Args:
        topic: The subject of the Instagram post.

    Returns:
        A formatted list of 20 relevant hashtags.
    """
    llm = get_llm()
    prompt = HASHTAG_PROMPT.format(topic=topic)
    response = llm.invoke(prompt)
    return str(response.content)
