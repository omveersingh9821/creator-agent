"""
Unit tests for the Creator Agent project.

These tests validate module imports, configuration loading, and tool
definitions WITHOUT making real API calls (no API key required).
"""

import importlib
import unittest
from unittest.mock import patch


class TestSettings(unittest.TestCase):
    """Verify that the settings module loads and exposes expected values."""

    def test_settings_module_imports(self) -> None:
        """Settings module should import without error."""
        mod = importlib.import_module("app.config.settings")
        self.assertTrue(hasattr(mod, "LLM_PROVIDER"))
        self.assertTrue(hasattr(mod, "MODEL_NAME"))
        self.assertTrue(hasattr(mod, "TEMPERATURE"))

    def test_llm_provider_is_string(self) -> None:
        from app.config.settings import LLM_PROVIDER
        self.assertIsInstance(LLM_PROVIDER, str)
        self.assertIn(LLM_PROVIDER, {"gemini", "openai", "anthropic"})

    def test_temperature_is_float(self) -> None:
        from app.config.settings import TEMPERATURE
        self.assertIsInstance(TEMPERATURE, float)
        self.assertGreaterEqual(TEMPERATURE, 0.0)
        self.assertLessEqual(TEMPERATURE, 2.0)


class TestLLMFactory(unittest.TestCase):
    """Verify the LLM factory raises correctly when API keys are missing."""

    @patch("app.config.settings.GOOGLE_API_KEY", "")
    @patch("app.config.settings.LLM_PROVIDER", "gemini")
    def test_gemini_raises_without_key(self) -> None:
        from app.core.llm_factory import get_llm
        with self.assertRaises(ValueError):
            get_llm()

    @patch("app.config.settings.OPENAI_API_KEY", "")
    @patch("app.config.settings.LLM_PROVIDER", "openai")
    def test_openai_raises_without_key(self) -> None:
        from app.core.llm_factory import get_llm
        with self.assertRaises(ValueError):
            get_llm()

    @patch("app.config.settings.LLM_PROVIDER", "unsupported")
    def test_invalid_provider_raises(self) -> None:
        from app.core.llm_factory import get_llm
        with self.assertRaises(ValueError):
            get_llm()


class TestToolDefinitions(unittest.TestCase):
    """Verify that each tool is properly decorated and has expected attributes."""

    def test_research_tool_exists(self) -> None:
        from app.tools.research_tool import research_trending_topics
        self.assertEqual(research_trending_topics.name, "research_trending_topics")
        self.assertTrue(research_trending_topics.description)

    def test_caption_tool_exists(self) -> None:
        from app.tools.caption_tool import generate_caption
        self.assertEqual(generate_caption.name, "generate_caption")
        self.assertTrue(generate_caption.description)

    def test_hashtag_tool_exists(self) -> None:
        from app.tools.hashtag_tool import generate_hashtags
        self.assertEqual(generate_hashtags.name, "generate_hashtags")
        self.assertTrue(generate_hashtags.description)

    def test_reel_tool_exists(self) -> None:
        from app.tools.reel_tool import generate_reel_script
        self.assertEqual(generate_reel_script.name, "generate_reel_script")
        self.assertTrue(generate_reel_script.description)

    def test_image_idea_tool_exists(self) -> None:
        from app.tools.image_idea_tool import generate_image_idea
        self.assertEqual(generate_image_idea.name, "generate_image_idea")
        self.assertTrue(generate_image_idea.description)


class TestPrompts(unittest.TestCase):
    """Verify prompt templates are non-empty and contain the {topic} placeholder."""

    def test_prompts_have_topic_placeholder(self) -> None:
        from app.prompts.prompts import (
            CAPTION_PROMPT,
            HASHTAG_PROMPT,
            IMAGE_IDEA_PROMPT,
            REEL_SCRIPT_PROMPT,
        )
        for prompt in [CAPTION_PROMPT, HASHTAG_PROMPT, IMAGE_IDEA_PROMPT, REEL_SCRIPT_PROMPT]:
            self.assertIn("{topic}", prompt)

    def test_agent_system_prompt_non_empty(self) -> None:
        from app.prompts.prompts import AGENT_SYSTEM_PROMPT
        self.assertTrue(len(AGENT_SYSTEM_PROMPT) > 50)


if __name__ == "__main__":
    unittest.main()
