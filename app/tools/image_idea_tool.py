"""
Image Idea Tool — suggests creative Instagram image concepts via the configured LLM.
"""

from langchain_core.tools import tool  # pyre-ignore[21]

from app.core.llm_factory import get_llm  # pyre-ignore[21]
from app.prompts.prompts import IMAGE_IDEA_PROMPT  # pyre-ignore[21]


@tool
def generate_image_idea(topic: str) -> str:
    """Suggest a creative image concept for an Instagram post on the given topic.

    Returns a detailed visual description including composition, colour palette,
    text overlay ideas, and mood/aesthetic.

    Args:
        topic: The subject of the Instagram post.

    Returns:
        A detailed image concept description.
    """
    llm = get_llm()
    prompt = IMAGE_IDEA_PROMPT.format(topic=topic)
    response = llm.invoke(prompt)
    return str(response.content)
