"""
Unit tests for the FastAPI backend.

Tests the API endpoints and request/response models WITHOUT making
real LLM calls — the agent is mocked to return deterministic output.
"""

import unittest
from unittest.mock import patch, MagicMock

from fastapi.testclient import TestClient


class TestHealthEndpoint(unittest.TestCase):
    """Verify the health check endpoint works."""

    def setUp(self) -> None:
        # Patch create_agent before importing the app module so the
        # module-level agent initialization doesn't require a real API key.
        self.patcher = patch("app.api.create_agent")
        self.mock_create_agent = self.patcher.start()
        self.mock_create_agent.return_value = MagicMock()

        # Import AFTER patching so module-level code uses the mock
        from app.api import app  # pyre-ignore[21]
        self.client = TestClient(app)

    def tearDown(self) -> None:
        self.patcher.stop()

    def test_health_returns_ok(self) -> None:
        """GET /api/health should return 200 with status ok."""
        response = self.client.get("/api/health")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), {"status": "ok"})


class TestGenerateEndpoint(unittest.TestCase):
    """Verify the /api/generate endpoint."""

    def setUp(self) -> None:
        # Create a mock agent that returns a known output
        self.mock_agent = MagicMock()
        self.mock_agent.invoke.return_value = {
            "output": "**Caption:** Test caption\n\n**Hashtags:** #test #ai"
        }

        self.patcher = patch("app.api.create_agent", return_value=self.mock_agent)
        self.mock_create_agent = self.patcher.start()

        # Re-import after patching to reset module-level agent
        import importlib
        import app.api  # pyre-ignore[21]
        importlib.reload(app.api)
        app.api.agent_executor = self.mock_agent

        from app.api import app as fastapi_app  # pyre-ignore[21]
        self.client = TestClient(fastapi_app)

    def tearDown(self) -> None:
        self.patcher.stop()

    def test_generate_returns_200_with_valid_topic(self) -> None:
        """POST /api/generate with a valid topic should return 200."""
        response = self.client.post(
            "/api/generate",
            json={"topic": "AI automation"},
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("result", data)
        self.assertIsInstance(data["result"], str)
        self.assertIn("Test caption", data["result"])

    def test_generate_calls_agent_invoke(self) -> None:
        """The endpoint should invoke the agent with the user's topic."""
        self.client.post(
            "/api/generate",
            json={"topic": "fitness tips"},
        )
        self.mock_agent.invoke.assert_called_once_with({"input": "fitness tips"})

    def test_generate_rejects_missing_topic(self) -> None:
        """POST /api/generate without 'topic' should return 422."""
        response = self.client.post("/api/generate", json={})
        self.assertEqual(response.status_code, 422)

    def test_generate_rejects_wrong_method(self) -> None:
        """GET /api/generate should return 405 Method Not Allowed."""
        response = self.client.get("/api/generate")
        self.assertEqual(response.status_code, 405)


class TestGenerateEndpointErrorHandling(unittest.TestCase):
    """Verify error handling in the generate endpoint."""

    def setUp(self) -> None:
        # Create a mock agent that raises an exception
        self.mock_agent = MagicMock()
        self.mock_agent.invoke.side_effect = RuntimeError("LLM connection failed")

        self.patcher = patch("app.api.create_agent", return_value=self.mock_agent)
        self.mock_create_agent = self.patcher.start()

        import importlib
        import app.api  # pyre-ignore[21]
        importlib.reload(app.api)
        app.api.agent_executor = self.mock_agent

        from app.api import app as fastapi_app  # pyre-ignore[21]
        self.client = TestClient(fastapi_app)

    def tearDown(self) -> None:
        self.patcher.stop()

    def test_generate_returns_500_on_agent_error(self) -> None:
        """If the agent raises, the endpoint should return 500."""
        response = self.client.post(
            "/api/generate",
            json={"topic": "test topic"},
        )
        self.assertEqual(response.status_code, 500)
        self.assertIn("LLM connection failed", response.json()["detail"])


class TestRequestResponseModels(unittest.TestCase):
    """Verify the Pydantic models used by the API."""

    def test_generate_request_model(self) -> None:
        from app.api import GenerateRequest  # pyre-ignore[21]
        req = GenerateRequest(topic="AI agents")
        self.assertEqual(req.topic, "AI agents")

    def test_generate_response_model(self) -> None:
        from app.api import GenerateResponse  # pyre-ignore[21]
        resp = GenerateResponse(result="some content")
        self.assertEqual(resp.result, "some content")


if __name__ == "__main__":
    unittest.main()
