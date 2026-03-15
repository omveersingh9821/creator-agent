"""
LLM Factory — configurable model instantiation.

Switch between Google Gemini and OpenAI by changing the LLM_PROVIDER
environment variable.  This is the single point where the LLM is created
so every part of the application uses the same instance configuration.
"""

from langchain_core.language_models import BaseChatModel  # pyre-ignore[21]

from app.config.settings import (  # pyre-ignore[21]
    GOOGLE_API_KEY,
    LLM_PROVIDER,
    MODEL_NAME,
    OPENAI_API_KEY,
    ANTHROPIC_API_KEY,
    TEMPERATURE,
)


def get_llm() -> BaseChatModel:
    """
    Return a configured chat model based on the current LLM_PROVIDER setting.

    Raises:
        ValueError: If LLM_PROVIDER is not "gemini" or "openai".
        ValueError: If the required API key is missing.
    """

    if LLM_PROVIDER == "gemini":
        if not GOOGLE_API_KEY:
            raise ValueError(
                "GOOGLE_API_KEY is required when LLM_PROVIDER='gemini'. "
                "Set it in your .env file."
            )
        from langchain_google_genai import ChatGoogleGenerativeAI  # pyre-ignore[21]

        return ChatGoogleGenerativeAI(
            model=MODEL_NAME,
            google_api_key=GOOGLE_API_KEY,
            temperature=TEMPERATURE,
        )

    elif LLM_PROVIDER == "openai":
        if not OPENAI_API_KEY:
            raise ValueError(
                "OPENAI_API_KEY is required when LLM_PROVIDER='openai'. "
                "Set it in your .env file."
            )
        from pydantic import SecretStr  # pyre-ignore[21]
        from langchain_openai import ChatOpenAI  # pyre-ignore[21]

        return ChatOpenAI(
            model=MODEL_NAME,
            api_key=SecretStr(OPENAI_API_KEY),
            temperature=TEMPERATURE,
        )

    elif LLM_PROVIDER == "anthropic":
        if not ANTHROPIC_API_KEY:
            raise ValueError(
                "ANTHROPIC_API_KEY is required when LLM_PROVIDER='anthropic'. "
                "Set it in your .env file."
            )
        from pydantic import SecretStr  # pyre-ignore[21]
        from langchain_anthropic import ChatAnthropic  # pyre-ignore[21]

        # Use the user-provided MODEL_NAME or default to sonnet 3.5
        model_to_use = MODEL_NAME if MODEL_NAME != "gemini-2.0-flash" else "claude-3-5-sonnet-latest"
        return ChatAnthropic(
            model_name=model_to_use,
            api_key=SecretStr(ANTHROPIC_API_KEY),
            temperature=TEMPERATURE,
        )

    else:
        raise ValueError(
            f"Unsupported LLM_PROVIDER='{LLM_PROVIDER}'. "
            "Choose 'gemini', 'openai', or 'anthropic'."
        )
