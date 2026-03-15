"""
Research Tool — discovers trending topics using DuckDuckGo search.

This is the only tool that makes external network calls; the others
are pure LLM-based generators.
"""

from langchain_community.tools import DuckDuckGoSearchResults  # pyre-ignore[21]
from langchain_core.tools import tool  # pyre-ignore[21]


# Reusable search wrapper (max 8 results keeps context concise)
_search = DuckDuckGoSearchResults(num_results=8)


@tool
def research_trending_topics(query: str) -> str:
    """Search the internet for trending topics and recent news about the given query.

    Use this tool FIRST to discover what is currently popular or newsworthy
    about a subject so the rest of the content feels timely and relevant.

    Args:
        query: The niche or topic to research (e.g. "AI agents", "fitness tips").

    Returns:
        A summary of recent search results for the query.
    """
    try:
        results: str = _search.invoke(query)
        return (
            f"Here are the latest trending results for '{query}':\n\n{results}"
        )
    except Exception as exc:
        return f"Research failed for '{query}': {exc}"
