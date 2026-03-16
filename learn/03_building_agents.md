# Module 3 – Building Your First Agent

## What is an Agent?

An agent is an LLM in a **loop** that can:
1. Receive a goal
2. Decide what action to take (tool call or final answer)
3. Execute the action
4. Observe the result
5. Repeat until the goal is reached

```
Goal → [Think → Act → Observe] → [Think → Act → Observe] → ... → Answer
```

This is often called the **ReAct** pattern (Reason + Act).

---

## Minimal Agent Implementation

```python
import anthropic
import json
from typing import Any

client = anthropic.Anthropic()

# ── tools ──────────────────────────────────────────────────────────────────

def calculator(expression: str) -> str:
    try:
        result = eval(expression, {"__builtins__": {}})
        return json.dumps({"result": result})
    except Exception as e:
        return json.dumps({"error": str(e)})

def get_current_date() -> str:
    from datetime import date
    return json.dumps({"date": date.today().isoformat()})

TOOLS_SCHEMA = [
    {
        "name": "calculator",
        "description": "Evaluate a mathematical expression. Use Python syntax.",
        "input_schema": {
            "type": "object",
            "properties": {"expression": {"type": "string"}},
            "required": ["expression"]
        }
    },
    {
        "name": "get_current_date",
        "description": "Return today's date in ISO format.",
        "input_schema": {"type": "object", "properties": {}}
    }
]

TOOL_MAP = {
    "calculator": lambda inp: calculator(**inp),
    "get_current_date": lambda inp: get_current_date(),
}

# ── agent loop ─────────────────────────────────────────────────────────────

def run_agent(user_goal: str, max_steps: int = 10) -> str:
    messages = [{"role": "user", "content": user_goal}]
    step = 0

    while step < max_steps:
        step += 1
        print(f"\n── Step {step} ──")

        response = client.messages.create(
            model="claude-sonnet-4-6",
            max_tokens=2048,
            system="You are a helpful assistant with access to tools. Use them when needed.",
            tools=TOOLS_SCHEMA,
            messages=messages,
        )

        # collect any text the model produced
        for block in response.content:
            if hasattr(block, "text"):
                print(f"[think] {block.text}")

        if response.stop_reason == "end_turn":
            # model is done — extract final text
            text_blocks = [b.text for b in response.content if hasattr(b, "text")]
            return "\n".join(text_blocks)

        if response.stop_reason == "tool_use":
            tool_results = []
            for block in response.content:
                if block.type == "tool_use":
                    print(f"[act]   {block.name}({block.input})")
                    result = TOOL_MAP[block.name](block.input)
                    print(f"[obs]   {result}")
                    tool_results.append({
                        "type": "tool_result",
                        "tool_use_id": block.id,
                        "content": result,
                    })

            messages.append({"role": "assistant", "content": response.content})
            messages.append({"role": "user", "content": tool_results})

        else:
            # unexpected stop reason
            break

    return "Agent reached max steps without a final answer."


# ── run it ─────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    answer = run_agent(
        "What is 15% of 847, and what day of the week is today?"
    )
    print(f"\n── Final Answer ──\n{answer}")
```

---

## Agent Anatomy Breakdown

```
┌─────────────────────────────────────┐
│             AGENT                   │
│                                     │
│  system_prompt  ← defines persona   │
│  tools          ← what it can do    │
│  messages       ← conversation mem  │
│  max_steps      ← safety limit      │
└─────────────────────────────────────┘
```

### System Prompt Design for Agents

```python
SYSTEM = """
You are a research assistant agent. Your job is to answer user questions
accurately using available tools.

Rules:
1. Always use tools to fetch facts — do not guess.
2. If a tool fails, report the error and try an alternative approach.
3. When you have enough information, give a clear, concise final answer.
4. Think step by step before acting.
"""
```

---

## Adding a Scratchpad (Chain-of-Thought)

Tell the model to think before acting using XML tags:

```python
SYSTEM = """
You are a problem-solving agent.

Before every action, write your reasoning inside <think>...</think> tags.
This is your private scratchpad — it won't be shown to the user.
After reasoning, take the appropriate action or give the final answer.
"""
```

Example output the model might produce:
```
<think>
The user wants to know the compound interest on $10,000 at 5% for 3 years.
Formula: A = P(1 + r)^t = 10000 * (1.05)^3
I should use the calculator tool.
</think>
[tool_use: calculator("10000 * (1.05 ** 3)")]
```

---

## Error Handling in Agent Loops

```python
def safe_tool_call(name: str, inputs: dict) -> str:
    try:
        return TOOL_MAP[name](inputs)
    except KeyError:
        return json.dumps({"error": f"Unknown tool: {name}"})
    except Exception as e:
        return json.dumps({"error": str(e), "tool": name})

# In the loop, use safe_tool_call instead of TOOL_MAP[block.name](block.input)
# The model will see the error and can adapt its strategy
```

---

## File System Agent Example

An agent that can read, list, and search files:

```python
import os, pathlib

def list_files(directory: str) -> str:
    p = pathlib.Path(directory)
    if not p.exists():
        return json.dumps({"error": "Directory not found"})
    files = [str(f.relative_to(p)) for f in p.iterdir()]
    return json.dumps({"files": files})

def read_file(path: str) -> str:
    try:
        content = pathlib.Path(path).read_text()
        return json.dumps({"content": content[:3000]})  # truncate
    except Exception as e:
        return json.dumps({"error": str(e)})

def write_file(path: str, content: str) -> str:
    try:
        pathlib.Path(path).write_text(content)
        return json.dumps({"success": True, "path": path})
    except Exception as e:
        return json.dumps({"error": str(e)})

FS_TOOLS = [
    {
        "name": "list_files",
        "description": "List files in a directory.",
        "input_schema": {
            "type": "object",
            "properties": {"directory": {"type": "string"}},
            "required": ["directory"]
        }
    },
    {
        "name": "read_file",
        "description": "Read the contents of a file.",
        "input_schema": {
            "type": "object",
            "properties": {"path": {"type": "string"}},
            "required": ["path"]
        }
    },
    {
        "name": "write_file",
        "description": "Write content to a file (creates or overwrites).",
        "input_schema": {
            "type": "object",
            "properties": {
                "path": {"type": "string"},
                "content": {"type": "string"}
            },
            "required": ["path", "content"]
        }
    }
]
```

---

## Streaming Agent Responses

Show the user what the agent is doing in real time:

```python
with client.messages.stream(
    model="claude-sonnet-4-6",
    max_tokens=2048,
    tools=TOOLS_SCHEMA,
    messages=messages,
) as stream:
    for event in stream:
        if hasattr(event, "delta") and hasattr(event.delta, "text"):
            print(event.delta.text, end="", flush=True)
```

---

## Key Takeaways

- An agent = LLM + tool loop + message history.
- The loop runs until `stop_reason == "end_turn"` or `max_steps`.
- Always set a `max_steps` safety limit.
- Feed tool errors back to the model — it can self-correct.
- System prompts define the agent's personality, rules, and reasoning style.

**Next:** [04 – Memory & State](04_memory_and_state.md)
