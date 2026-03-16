# Module 1 – LLM Basics & Prompting

## What is an LLM?

A Large Language Model (LLM) is a neural network trained to predict the next token in a sequence. At inference time you give it a **prompt** and it returns a **completion**. Everything in agentic AI is built on top of this simple interface.

```
prompt → [LLM] → completion
```

---

## The Chat API Shape

Every modern LLM exposes a **messages** array. Each message has a `role` and `content`.

| Role | Who it is |
|------|-----------|
| `system` | Sets the persona / rules for the model |
| `user` | Input from the human (or orchestrator) |
| `assistant` | The model's previous replies |
| `tool` | Result returned by a tool call |

### Example – raw API call (Python + Anthropic SDK)

```python
import anthropic

client = anthropic.Anthropic()  # reads ANTHROPIC_API_KEY from env

response = client.messages.create(
    model="claude-sonnet-4-6",
    max_tokens=1024,
    system="You are a helpful travel agent.",
    messages=[
        {"role": "user", "content": "What are the top 3 cities to visit in Japan?"}
    ]
)

print(response.content[0].text)
```

---

## Prompt Engineering Fundamentals

### 1. System Prompt
Sets persistent context. Think of it as a job description for the model.

```python
system = """
You are an expert Python developer.
- Always include type hints.
- Prefer stdlib over third-party packages.
- If you don't know, say so.
"""
```

### 2. Few-Shot Examples
Show the model the format you expect by giving examples inside the prompt.

```python
messages = [
    {
        "role": "user",
        "content": """Classify the sentiment. Reply with only: positive / negative / neutral.

Examples:
Input: "I loved it!" → positive
Input: "Terrible service." → negative
Input: "It was okay." → neutral

Input: "Best pizza I've ever had."
"""
    }
]
```

### 3. Chain-of-Thought (CoT)
Tell the model to reason step by step before giving the final answer.

```python
messages = [
    {
        "role": "user",
        "content": """Solve this step by step:
A train travels 120 km in 2 hours. What is its average speed?

Think through it step by step, then give the final answer."""
    }
]
```

### 4. Output Formatting
Force structured output so downstream code can parse it reliably.

```python
messages = [
    {
        "role": "user",
        "content": """Extract the flight details and return ONLY valid JSON:

"I'm flying from NYC to LAX on March 20, departing at 9am."

Schema:
{
  "origin": string,
  "destination": string,
  "date": "YYYY-MM-DD",
  "departure_time": "HH:MM"
}"""
    }
]
```

---

## Temperature & Sampling

| Parameter | Effect |
|-----------|--------|
| `temperature=0` | Deterministic – best for structured output & tools |
| `temperature=0.7` | Balanced – good for conversation |
| `temperature=1.0+` | Creative – good for brainstorming |

```python
response = client.messages.create(
    model="claude-sonnet-4-6",
    max_tokens=512,
    temperature=0,           # deterministic output
    messages=[{"role": "user", "content": "Return the capital of France as JSON: {\"capital\": ...}"}]
)
```

---

## Tokens & Context Window

- Everything is measured in **tokens** (~¾ of a word each).
- Models have a **context window** – the maximum total tokens (input + output).
- Claude Sonnet 4.6: 200k token context window.

```python
# Check token usage after a call
print(response.usage.input_tokens)   # tokens you sent
print(response.usage.output_tokens)  # tokens in the reply
```

---

## Key Takeaways

- The chat API is just a list of messages → the model produces the next one.
- System prompt = persistent rules; user/assistant = conversation turns.
- Use `temperature=0` when you need reliable, parseable output.
- Token counting matters for long agent loops.

**Next:** [02 – Tool Calling](02_tool_calling.md)
