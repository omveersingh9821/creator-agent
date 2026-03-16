# Module 8 – Evaluation & Reliability

## Why Evaluation Matters

Agents fail in subtle ways:
- Model makes wrong tool calls
- Agent gets stuck in loops
- Context grows too large and quality degrades
- Works in dev, breaks with real user inputs

Systematic evaluation finds these failures before users do.

---

## The Eval Stack

```
Unit tests      → Does each tool/function work correctly?
Agent tests     → Does the agent complete tasks correctly?
LLM-as-judge    → Is the output quality good?
Load tests      → Does it work under concurrent usage?
Regression suite → Did the last change break anything?
```

---

## 1. Unit Testing Tools

Test tool functions in isolation — no LLM needed.

```python
import pytest, json

# The tool under test
def calculator(expression: str) -> str:
    try:
        result = eval(expression, {"__builtins__": {}})
        return json.dumps({"result": result})
    except Exception as e:
        return json.dumps({"error": str(e)})

# Tests
class TestCalculator:
    def test_basic_math(self):
        result = json.loads(calculator("2 + 2"))
        assert result["result"] == 4

    def test_float_result(self):
        result = json.loads(calculator("10 / 3"))
        assert abs(result["result"] - 3.333) < 0.01

    def test_invalid_expression(self):
        result = json.loads(calculator("import os"))
        assert "error" in result

    def test_complex_expression(self):
        result = json.loads(calculator("(15 * 0.2) + 100"))
        assert result["result"] == 103.0

# run: pytest test_tools.py -v
```

---

## 2. Agent Task Tests

Test whether the agent completes a defined task correctly.

```python
import anthropic, json
from dataclasses import dataclass

client = anthropic.Anthropic()

@dataclass
class AgentTestCase:
    name: str
    user_input: str
    expected_tool_calls: list[str]      # tools that MUST be called
    expected_output_contains: list[str] # strings that must appear in output
    forbidden_output: list[str] = None  # strings that must NOT appear

def run_agent_test(test: AgentTestCase, agent_fn) -> dict:
    result = {
        "name": test.name,
        "passed": True,
        "failures": []
    }

    output, tool_calls_made = agent_fn(test.user_input)

    # Check required tool calls
    for tool in test.expected_tool_calls:
        if tool not in tool_calls_made:
            result["passed"] = False
            result["failures"].append(f"Expected tool '{tool}' was not called")

    # Check output content
    for phrase in test.expected_output_contains:
        if phrase.lower() not in output.lower():
            result["passed"] = False
            result["failures"].append(f"Output missing: '{phrase}'")

    # Check forbidden content
    for phrase in (test.forbidden_output or []):
        if phrase.lower() in output.lower():
            result["passed"] = False
            result["failures"].append(f"Output contains forbidden: '{phrase}'")

    return result

# Example test cases
TEST_SUITE = [
    AgentTestCase(
        name="weather_query",
        user_input="What's the weather in Paris?",
        expected_tool_calls=["get_weather"],
        expected_output_contains=["Paris"],
    ),
    AgentTestCase(
        name="math_calculation",
        user_input="Calculate 847 * 0.15",
        expected_tool_calls=["calculator"],
        expected_output_contains=["127.05"],
    ),
    AgentTestCase(
        name="no_hallucination",
        user_input="What's the population of the moon?",
        expected_tool_calls=[],
        expected_output_contains=["don't", "no"],
        forbidden_output=["million", "billion"],
    ),
]
```

---

## 3. LLM-as-Judge

Use Claude to evaluate output quality — the most flexible eval method.

```python
def llm_judge(
    question: str,
    agent_answer: str,
    criteria: list[str],
    reference_answer: str = None
) -> dict:
    """Score an agent's answer on multiple criteria."""

    criteria_str = "\n".join(f"{i+1}. {c}" for i, c in enumerate(criteria))
    ref_str = f"\nReference answer: {reference_answer}" if reference_answer else ""

    response = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=512,
        temperature=0,  # deterministic for evals
        messages=[{
            "role": "user",
            "content": f"""Evaluate this agent response.

Question: {question}
Agent Answer: {agent_answer}{ref_str}

Score each criterion from 1-5 and explain why.
Criteria:
{criteria_str}

Respond ONLY as valid JSON:
{{
  "scores": {{"criterion_name": score}},
  "overall": float,
  "reasoning": "brief explanation"
}}"""
        }]
    )

    return json.loads(response.content[0].text)


# Usage
score = llm_judge(
    question="Explain what RAG is.",
    agent_answer="RAG is Retrieval Augmented Generation. It searches a database for relevant info and injects it into the LLM prompt so the model can answer accurately.",
    criteria=[
        "Factual accuracy",
        "Completeness — covers the key concepts",
        "Clarity — easy to understand",
    ]
)

print(json.dumps(score, indent=2))
```

---

## 4. Guardrails & Safety Checks

Validate agent inputs and outputs at system boundaries.

```python
def input_guardrail(user_input: str) -> str | None:
    """Return error string if input is unsafe, else None."""
    BLOCKED_PATTERNS = [
        "ignore previous instructions",
        "act as DAN",
        "jailbreak",
    ]
    lower = user_input.lower()
    for pattern in BLOCKED_PATTERNS:
        if pattern in lower:
            return f"Input blocked: contains restricted pattern '{pattern}'"
    if len(user_input) > 10_000:
        return "Input too long (max 10,000 characters)"
    return None

def output_guardrail(output: str) -> str:
    """Sanitize or filter agent output before sending to user."""
    # Remove potential PII patterns (basic example)
    import re
    output = re.sub(r'\b\d{3}-\d{2}-\d{4}\b', '[SSN REDACTED]', output)
    output = re.sub(r'\b\d{16}\b', '[CARD REDACTED]', output)
    return output

def safe_agent_call(user_input: str, agent_fn) -> str:
    # Check input
    error = input_guardrail(user_input)
    if error:
        return f"Error: {error}"

    # Run agent
    output = agent_fn(user_input)

    # Check output
    output = output_guardrail(output)
    return output
```

---

## 5. Retry & Resilience

```python
import time, functools
from anthropic import RateLimitError, APIStatusError

def with_retry(max_retries: int = 3, backoff: float = 1.0):
    """Decorator to retry on transient API errors."""
    def decorator(fn):
        @functools.wraps(fn)
        def wrapper(*args, **kwargs):
            for attempt in range(max_retries):
                try:
                    return fn(*args, **kwargs)
                except RateLimitError:
                    wait = backoff * (2 ** attempt)
                    print(f"Rate limited. Retrying in {wait}s...")
                    time.sleep(wait)
                except APIStatusError as e:
                    if e.status_code >= 500 and attempt < max_retries - 1:
                        time.sleep(backoff)
                        continue
                    raise
            raise RuntimeError(f"Failed after {max_retries} attempts")
        return wrapper
    return decorator

@with_retry(max_retries=3, backoff=2.0)
def call_claude(messages: list) -> str:
    response = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=1024,
        messages=messages,
    )
    return response.content[0].text
```

---

## 6. Regression Testing Suite

Run your eval suite on every code change:

```python
# eval_suite.py
import json
from datetime import datetime

CASES = [
    {
        "id": "tc_001",
        "input": "What is 2+2?",
        "expected": "4",
        "tags": ["math", "basic"]
    },
    {
        "id": "tc_002",
        "input": "What is the capital of France?",
        "expected": "Paris",
        "tags": ["geography"]
    },
]

def run_regression_suite(agent_fn) -> dict:
    results = []
    for case in CASES:
        output = agent_fn(case["input"])
        passed = case["expected"].lower() in output.lower()
        results.append({
            "id": case["id"],
            "passed": passed,
            "output": output,
            "tags": case["tags"]
        })

    total = len(results)
    passed = sum(1 for r in results if r["passed"])
    report = {
        "timestamp": datetime.now().isoformat(),
        "total": total,
        "passed": passed,
        "failed": total - passed,
        "pass_rate": passed / total,
        "results": results
    }

    # Save report
    with open(f"eval_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json", "w") as f:
        json.dump(report, f, indent=2)

    print(f"Passed: {passed}/{total} ({report['pass_rate']:.0%})")
    return report
```

---

## 7. Monitoring in Production

```python
import time, logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("agent")

class MonitoredAgent:
    def __init__(self, agent_fn):
        self.agent_fn = agent_fn
        self.call_count = 0
        self.total_tokens = 0
        self.errors = 0

    def __call__(self, user_input: str) -> str:
        start = time.time()
        self.call_count += 1

        try:
            result = self.agent_fn(user_input)
            latency = time.time() - start

            logger.info(json.dumps({
                "event": "agent_call",
                "latency_ms": round(latency * 1000),
                "call_count": self.call_count,
                "input_length": len(user_input),
                "output_length": len(result),
            }))
            return result

        except Exception as e:
            self.errors += 1
            logger.error(json.dumps({
                "event": "agent_error",
                "error": str(e),
                "error_count": self.errors,
            }))
            raise
```

---

## Eval Checklist

Before shipping an agent to production:

- [ ] Unit tests cover all tools (happy path + error cases)
- [ ] Agent completes a benchmark of 20+ representative tasks
- [ ] LLM-as-judge scores average ≥ 4/5 on key criteria
- [ ] Guardrails tested with adversarial inputs
- [ ] Retry logic tested with simulated API failures
- [ ] Token usage and latency are within acceptable bounds
- [ ] Regression suite runs on every PR/deploy

---

## Key Takeaways

- Test tools in isolation first — they're easy to unit test.
- Use LLM-as-judge for semantic quality evaluation.
- Guardrails protect against prompt injection and sensitive data leaks.
- Always wrap API calls in retry logic with exponential backoff.
- Build a regression suite early and run it on every change.

---

## What's Next?

You've covered the full agentic AI stack:

1. LLM basics & prompting
2. Tool calling
3. Agent loops
4. Memory & state
5. RAG
6. Multi-agent systems
7. Orchestration frameworks
8. Evaluation & reliability

**Go build something.** Start with a simple agent + 2-3 tools, then layer in memory, RAG, and multi-agent patterns as your use case demands.
