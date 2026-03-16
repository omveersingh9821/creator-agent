# Module 9 – LangChain (with Your Actual Code)

LangChain is the framework your project already uses. This guide explains every
concept by pointing at the real files in `app/`.

---

## What LangChain Does

LangChain provides three things:
1. **Unified LLM interface** — same API for OpenAI, Gemini, Anthropic, etc.
2. **Tool system** — `@tool` decorator + automatic schema generation
3. **Agent executor** — the loop that calls the LLM, runs tools, feeds results back

```
Your code → LangChain → Any LLM provider
```

---

## 1. The LLM Factory (`app/core/llm_factory.py`)

This is the single place where the LLM is created. Every agent in the project
calls `get_llm()` — none of them know or care which model is running.

```python
from langchain_core.language_models import BaseChatModel

def get_llm() -> BaseChatModel:          # BaseChatModel is the abstract type
    if LLM_PROVIDER == "gemini":
        from langchain_google_genai import ChatGoogleGenerativeAI
        return ChatGoogleGenerativeAI(model=MODEL_NAME, ...)

    elif LLM_PROVIDER == "openai":
        from langchain_openai import ChatOpenAI
        return ChatOpenAI(model=MODEL_NAME, ...)

    elif LLM_PROVIDER == "anthropic":
        from langchain_anthropic import ChatAnthropic
        return ChatAnthropic(model_name=MODEL_NAME, ...)
```

### Why `BaseChatModel`?

`BaseChatModel` is the **interface** (abstract base class). All three providers
implement it, which means the agent code only needs to call:

```python
llm = get_llm()
response = llm.invoke("Hello!")     # works with any provider
```

### Calling the LLM directly

```python
from app.core.llm_factory import get_llm

llm = get_llm()

# Simple string prompt
response = llm.invoke("What is RAG?")
print(response.content)       # ← always .content, regardless of provider

# With a list of messages
from langchain_core.messages import HumanMessage, SystemMessage

response = llm.invoke([
    SystemMessage(content="You are a travel expert."),
    HumanMessage(content="Best cities to visit in Japan?"),
])
print(response.content)
```

---

## 2. The `@tool` Decorator

Used in every file in `app/tools/`. It does three things automatically:
- Wraps your function as a LangChain tool
- Reads the docstring to build the tool description the LLM sees
- Reads the type hints to build the JSON schema for arguments

### From `app/tools/caption_tool.py`

```python
from langchain_core.tools import tool
from app.core.llm_factory import get_llm

@tool
def generate_caption(topic: str) -> str:
    """Generate an engaging Instagram caption for the given topic.
    ...
    Args:
        topic: The subject of the Instagram post (e.g. "AI automation").
    Returns:
        A ready-to-post Instagram caption.
    """
    llm = get_llm()
    prompt = CAPTION_PROMPT.format(topic=topic)
    response = llm.invoke(prompt)
    return str(response.content)
```

The LLM sees:
```json
{
  "name": "generate_caption",
  "description": "Generate an engaging Instagram caption for the given topic...",
  "parameters": {
    "type": "object",
    "properties": {
      "topic": {"type": "string", "description": "The subject of the Instagram post"}
    },
    "required": ["topic"]
  }
}
```

### From `app/tools/research_tool.py` — using a community tool

```python
from langchain_community.tools import DuckDuckGoSearchResults

_search = DuckDuckGoSearchResults(num_results=8)

@tool
def research_trending_topics(query: str) -> str:
    """Search the internet for trending topics..."""
    results: str = _search.invoke(query)   # wraps the search API call
    return f"Latest results for '{query}':\n\n{results}"
```

`langchain_community` is a library of 100+ pre-built tool integrations
(search engines, databases, APIs). You use it here for DuckDuckGo.

### Writing your own tool — the pattern

```python
from langchain_core.tools import tool
import json

@tool
def get_exchange_rate(from_currency: str, to_currency: str) -> str:
    """Get the current exchange rate between two currencies.

    Args:
        from_currency: Source currency code (e.g. "USD")
        to_currency: Target currency code (e.g. "EUR")

    Returns:
        Exchange rate as a JSON string.
    """
    # call your real API here
    rate = 0.92  # placeholder
    return json.dumps({"from": from_currency, "to": to_currency, "rate": rate})
```

Rules:
- Always write a docstring — the LLM reads it to decide when to call the tool.
- Always include `Args:` section with descriptions.
- Return a **string** (JSON strings work best).
- Catch exceptions inside the tool and return an error string.

---

## 3. The Prompt Template

The prompt is the "brain blueprint" — it tells the agent how to behave.

### From `app/agent/agent.py`

```python
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder

def _build_prompt() -> ChatPromptTemplate:
    return ChatPromptTemplate.from_messages([
        ("system", AGENT_SYSTEM_PROMPT),                          # ① persona & rules
        MessagesPlaceholder(variable_name="chat_history",         # ② conversation memory
                            optional=True),
        ("human", "{input}"),                                     # ③ current user message
        MessagesPlaceholder(variable_name="agent_scratchpad"),    # ④ tool call history
    ])
```

Each slot explained:

| Slot | What it holds |
|------|--------------|
| `("system", ...)` | Static instructions — persona, output format, rules |
| `chat_history` | Previous turns from this session (for multi-turn conversations) |
| `("human", "{input}")` | The current user message — filled at runtime |
| `agent_scratchpad` | **Auto-filled by LangChain** — tool calls + results so far in this step |

`agent_scratchpad` is the key difference from a plain chat prompt. It's where
LangChain inserts the intermediate reasoning steps (tool calls + their results)
so the model can see what it has already done this turn.

### From `app/agents/travel_agent.py` — simpler version

```python
prompt = ChatPromptTemplate.from_messages([
    ("system", system_prompt),
    ("human", "{input}"),
    ("placeholder", "{agent_scratchpad}"),    # same slot, shorthand syntax
])
```

---

## 4. `create_tool_calling_agent`

This function wires together the LLM, tools, and prompt into a **Runnable**
(a composable execution unit).

```python
from langchain.agents import create_tool_calling_agent

agent = create_tool_calling_agent(
    llm=llm,        # any BaseChatModel
    tools=tools,    # list of @tool-decorated functions
    prompt=prompt,  # ChatPromptTemplate with agent_scratchpad slot
)
```

Under the hood it creates a LangChain Expression Language (LCEL) chain:

```
prompt | llm.bind_tools(tools) | output_parser
```

- `llm.bind_tools(tools)` — attaches the tool schemas to every API call
- The output parser converts tool-use blocks into structured `AgentAction` objects

---

## 5. `AgentExecutor` — the Loop

`AgentExecutor` runs the agent in a loop until it produces a final answer.

```python
from langchain.agents import AgentExecutor

executor = AgentExecutor(
    agent=agent,
    tools=tools,
    verbose=VERBOSE,                    # print each step to console
    max_iterations=AGENT_MAX_ITERATIONS,# safety limit (prevents infinite loops)
    handle_parsing_errors=True,         # retry on malformed tool calls
    return_intermediate_steps=False,    # set True to see all tool calls in output
)
```

### Invoking the executor

```python
# Single turn
result = executor.invoke({"input": "Research AI trends and write a caption"})
print(result["output"])

# With chat history (multi-turn)
from langchain_core.messages import HumanMessage, AIMessage

result = executor.invoke({
    "input": "Now make it shorter",
    "chat_history": [
        HumanMessage(content="Write a caption about AI"),
        AIMessage(content="🤖 AI is changing everything..."),
    ]
})
```

### What happens inside `AgentExecutor.invoke()`

```
invoke({"input": "..."})
  │
  ├─ Step 1: render prompt → call LLM
  │          LLM returns: tool_use(research_trending_topics, query="AI trends")
  │
  ├─ Step 2: run tool → get result
  │          result: "Latest AI trends: agents, multimodal..."
  │
  ├─ Step 3: add tool result to scratchpad → call LLM again
  │          LLM returns: tool_use(generate_caption, topic="AI trends")
  │
  ├─ Step 4: run tool → get result
  │          result: "🤖 The future is here..."
  │
  └─ Step 5: call LLM → stop_reason=end_turn
             Final answer: "Here's your caption: 🤖 The future is here..."
```

---

## 6. The Full Creator Agent Flow

Connecting all the pieces in your project:

```
User: "Create content about AI automation"
              │
              ▼
    app/agent/agent.py: create_agent()
              │
    ┌─────────────────────────────────┐
    │         AgentExecutor           │
    │                                 │
    │  prompt ─────────────────────►  │
    │  [system, history, input,        │
    │   agent_scratchpad]             │
    │                                 │
    │  LLM (via get_llm()) ────────►  │
    │  [gemini | openai | anthropic]  │
    │                                 │
    │  tools ──────────────────────►  │
    │  [research_trending_topics]     │ ← tool call 1
    │  [generate_caption]             │ ← tool call 2
    │  [generate_hashtags]            │ ← tool call 3
    │  [generate_reel_script]         │ ← tool call 4
    │  [generate_image_idea]          │ ← tool call 5
    └─────────────────────────────────┘
              │
              ▼
    Final Answer → api.py → React frontend
```

---

## 7. LangChain Message Types

```python
from langchain_core.messages import (
    SystemMessage,    # system prompt
    HumanMessage,     # user turn
    AIMessage,        # model turn
    ToolMessage,      # tool result
)

# Build a manual conversation
messages = [
    SystemMessage(content="You are a travel expert."),
    HumanMessage(content="I want to visit Japan."),
    AIMessage(content="Great choice! Japan has amazing cities like Tokyo and Kyoto."),
    HumanMessage(content="What about food?"),
]

response = llm.invoke(messages)
print(response.content)
```

---

## 8. LCEL — LangChain Expression Language

LCEL is the `|` pipe operator that composes chains. `create_tool_calling_agent`
uses it internally. You can build custom chains the same way:

```python
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser

prompt = ChatPromptTemplate.from_template("Summarize this in one sentence: {text}")
parser = StrOutputParser()

# Chain: prompt → llm → parse output to string
chain = prompt | llm | parser

result = chain.invoke({"text": "LangChain is a framework for building LLM apps..."})
print(result)  # "LangChain is a framework for composing LLM-powered applications."
```

---

## 9. Streaming

```python
# Stream token by token
for chunk in executor.stream({"input": "Write a caption about fitness"}):
    if "output" in chunk:
        print(chunk["output"], end="", flush=True)

# Or stream from the LLM directly
for chunk in llm.stream("Tell me about RAG"):
    print(chunk.content, end="", flush=True)
```

---

## Quick Reference — What Lives Where

| Concept | LangChain class/function | Your file |
|---------|--------------------------|-----------|
| LLM interface | `BaseChatModel` | `app/core/llm_factory.py` |
| Define a tool | `@tool` decorator | `app/tools/*.py` |
| Built-in tools | `langchain_community.tools` | `app/tools/research_tool.py` |
| Prompt template | `ChatPromptTemplate` | `app/agent/agent.py` |
| Multi-turn slot | `MessagesPlaceholder` | `app/agent/agent.py` |
| Wire agent | `create_tool_calling_agent` | `app/agent/agent.py` |
| Run the loop | `AgentExecutor` | `app/agent/agent.py` |

---

## Key Takeaways

- `BaseChatModel` = the unified interface — swap providers by changing `.env`.
- `@tool` + docstring = the tool definition the LLM reads.
- `ChatPromptTemplate` = blueprint with `{input}` and `agent_scratchpad` slots.
- `create_tool_calling_agent` = wires LLM + tools + prompt.
- `AgentExecutor` = runs the think-act-observe loop with safety limits.

**Next:** [10 – LangGraph](10_langgraph.md) — adding state, branching, and persistence to what you already have.
