# Module 2 – Tool Calling / Function Calling

## The Core Idea

LLMs can't browse the web, query a database, or send an email by themselves. **Tool calling** solves this: you tell the model what tools exist, and when it needs one it emits a structured call instead of plain text. Your code runs the tool and feeds the result back. The model then continues.

```
user message
     ↓
   [LLM] → tool_use: get_weather(city="Tokyo")
     ↓
  your code runs get_weather("Tokyo") → "22°C, sunny"
     ↓
   [LLM] → "The weather in Tokyo is 22°C and sunny."
     ↓
 final reply to user
```

---

## Defining a Tool (Anthropic SDK)

A tool is described as a JSON schema. The model reads this schema to know what arguments to pass.

```python
import anthropic, json

client = anthropic.Anthropic()

# 1. Define tools
tools = [
    {
        "name": "get_weather",
        "description": "Get the current weather for a city.",
        "input_schema": {
            "type": "object",
            "properties": {
                "city": {
                    "type": "string",
                    "description": "The city name, e.g. 'Tokyo'"
                },
                "unit": {
                    "type": "string",
                    "enum": ["celsius", "fahrenheit"],
                    "description": "Temperature unit"
                }
            },
            "required": ["city"]
        }
    }
]
```

---

## The Tool-Use Loop

```python
import anthropic, json

client = anthropic.Anthropic()

# --- fake implementation ---
def get_weather(city: str, unit: str = "celsius") -> str:
    return json.dumps({"city": city, "temp": 22, "unit": unit, "condition": "sunny"})

# --- tool definitions (same as above) ---
tools = [
    {
        "name": "get_weather",
        "description": "Get the current weather for a city.",
        "input_schema": {
            "type": "object",
            "properties": {
                "city": {"type": "string"},
                "unit": {"type": "string", "enum": ["celsius", "fahrenheit"]}
            },
            "required": ["city"]
        }
    }
]

messages = [{"role": "user", "content": "What's the weather in Tokyo?"}]

# Step 1 – first call
response = client.messages.create(
    model="claude-sonnet-4-6",
    max_tokens=1024,
    tools=tools,
    messages=messages,
)

# Step 2 – handle tool use
while response.stop_reason == "tool_use":
    tool_results = []

    for block in response.content:
        if block.type == "tool_use":
            # dispatch to the right function
            if block.name == "get_weather":
                result = get_weather(**block.input)
            else:
                result = json.dumps({"error": "unknown tool"})

            tool_results.append({
                "type": "tool_result",
                "tool_use_id": block.id,
                "content": result
            })

    # append assistant turn + tool results, then call again
    messages.append({"role": "assistant", "content": response.content})
    messages.append({"role": "user", "content": tool_results})

    response = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=1024,
        tools=tools,
        messages=messages,
    )

# Step 3 – final text answer
print(response.content[0].text)
```

---

## Multiple Tools

Give the model a toolkit and let it choose which tool to use.

```python
tools = [
    {
        "name": "search_web",
        "description": "Search the web for current information.",
        "input_schema": {
            "type": "object",
            "properties": {"query": {"type": "string"}},
            "required": ["query"]
        }
    },
    {
        "name": "get_stock_price",
        "description": "Get the current stock price for a ticker symbol.",
        "input_schema": {
            "type": "object",
            "properties": {
                "ticker": {"type": "string", "description": "e.g. AAPL, TSLA"}
            },
            "required": ["ticker"]
        }
    },
    {
        "name": "send_email",
        "description": "Send an email to a recipient.",
        "input_schema": {
            "type": "object",
            "properties": {
                "to": {"type": "string"},
                "subject": {"type": "string"},
                "body": {"type": "string"}
            },
            "required": ["to", "subject", "body"]
        }
    }
]
```

---

## Parallel Tool Calls

The model can emit multiple tool calls in a single response. Handle them all before continuing.

```python
# response.content may contain multiple tool_use blocks
tool_calls = [b for b in response.content if b.type == "tool_use"]
print(f"Model requested {len(tool_calls)} tool calls in parallel")

# run them all (optionally in parallel with threading/asyncio)
results = []
for call in tool_calls:
    result = dispatch(call.name, call.input)
    results.append({
        "type": "tool_result",
        "tool_use_id": call.id,
        "content": result
    })
```

---

## Forcing or Preventing Tool Use

```python
# Force the model to use a specific tool
response = client.messages.create(
    model="claude-sonnet-4-6",
    max_tokens=1024,
    tools=tools,
    tool_choice={"type": "tool", "name": "get_weather"},  # must use this tool
    messages=messages,
)

# Prevent any tool use
response = client.messages.create(
    model="claude-sonnet-4-6",
    max_tokens=1024,
    tools=tools,
    tool_choice={"type": "none"},  # text-only response
    messages=messages,
)
```

---

## Tool Design Tips

| Principle | Why |
|-----------|-----|
| One tool, one job | Easier for the model to choose correctly |
| Write a clear `description` | The model uses this to decide when to call the tool |
| List all `required` fields | Prevents missing-argument errors |
| Return JSON strings | Easier to parse back |
| Keep responses short | Long tool results eat context |

---

## Real-World Example – SQL Query Tool

```python
import sqlite3, json

def query_database(sql: str) -> str:
    """Execute a read-only SQL query and return results as JSON."""
    conn = sqlite3.connect("sales.db")
    cursor = conn.execute(sql)
    columns = [d[0] for d in cursor.description]
    rows = [dict(zip(columns, row)) for row in cursor.fetchall()]
    conn.close()
    return json.dumps(rows[:50])  # limit rows to save context

tools = [
    {
        "name": "query_database",
        "description": (
            "Run a SELECT query against the sales database. "
            "Tables: orders(id, date, amount, customer_id), customers(id, name, email)."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "sql": {"type": "string", "description": "A valid SELECT SQL statement"}
            },
            "required": ["sql"]
        }
    }
]
```

---

## Key Takeaways

- Tool calling = LLM emits a structured call → your code runs it → result fed back.
- The loop runs until `stop_reason != "tool_use"`.
- Multiple tools can be called in a single turn.
- Good tool descriptions are as important as good code.

**Next:** [03 – Building Agents](03_building_agents.md)
