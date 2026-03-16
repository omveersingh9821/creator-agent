# Module 10 – LangGraph

LangGraph is the upgrade path from `AgentExecutor`. It gives you full control
over the agent loop by modelling it as a **directed graph** of nodes and edges.

---

## AgentExecutor vs LangGraph

| | `AgentExecutor` (what you have) | LangGraph |
|--|----------------------------------|-----------|
| Control flow | Fixed loop: think → act → observe | You define the graph |
| Branching | Not supported | `add_conditional_edges` |
| Persistent state | No | Yes (checkpointers) |
| Human-in-the-loop | No | Yes (`interrupt_before`) |
| Parallel branches | No | Yes |
| Visibility | `verbose=True` | Full state at every node |

Use `AgentExecutor` for simple agents. Use LangGraph when you need any of the
features in the right column.

---

## Core Concepts

```
StateGraph = a graph where:
  - Nodes   = Python functions that transform state
  - Edges   = transitions between nodes (fixed or conditional)
  - State   = a TypedDict shared by all nodes
```

The graph runs by passing state from node to node until it reaches `END`.

---

## Installation

```bash
pip install langgraph langchain-anthropic
```

---

## 1. Minimal LangGraph Agent

This is the LangGraph equivalent of your current `AgentExecutor` setup.

```python
import json
from typing import TypedDict, Annotated
import operator

from langchain_anthropic import ChatAnthropic
from langchain_core.messages import BaseMessage, HumanMessage, ToolMessage
from langchain_core.tools import tool
from langgraph.graph import StateGraph, END

# ── State ─────────────────────────────────────────────────────────────────────
# State is a TypedDict. Every node receives it and returns a partial update.
# Annotated[list, operator.add] means: "append to this list, don't overwrite it"

class AgentState(TypedDict):
    messages: Annotated[list[BaseMessage], operator.add]

# ── Tools ─────────────────────────────────────────────────────────────────────

@tool
def generate_caption(topic: str) -> str:
    """Generate an Instagram caption for a topic."""
    return f"🔥 Everything you need to know about {topic} in 2025! #trending"

@tool
def generate_hashtags(topic: str) -> str:
    """Generate relevant hashtags for a topic."""
    return f"#{topic.replace(' ', '')} #viral #trending #content"

tools = [generate_caption, generate_hashtags]
tool_map = {t.name: t for t in tools}

# ── LLM ───────────────────────────────────────────────────────────────────────

llm = ChatAnthropic(model="claude-sonnet-4-6")
llm_with_tools = llm.bind_tools(tools)   # attach tool schemas to every call

# ── Nodes ─────────────────────────────────────────────────────────────────────
# Each node is a function: (state) -> partial state update

def call_model(state: AgentState) -> AgentState:
    """Call the LLM with the current messages."""
    response = llm_with_tools.invoke(state["messages"])
    return {"messages": [response]}   # appended to the list

def run_tools(state: AgentState) -> AgentState:
    """Execute all tool calls from the last message."""
    last_message = state["messages"][-1]
    results = []

    for call in last_message.tool_calls:
        tool_fn = tool_map[call["name"]]
        output = tool_fn.invoke(call["args"])
        results.append(ToolMessage(
            content=str(output),
            tool_call_id=call["id"],
        ))

    return {"messages": results}

# ── Routing ───────────────────────────────────────────────────────────────────
# Returns the name of the next node to run

def should_continue(state: AgentState) -> str:
    last = state["messages"][-1]
    if hasattr(last, "tool_calls") and last.tool_calls:
        return "tools"      # → run_tools node
    return "end"            # → END

# ── Graph ─────────────────────────────────────────────────────────────────────

graph = StateGraph(AgentState)

graph.add_node("agent", call_model)
graph.add_node("tools", run_tools)

graph.set_entry_point("agent")

graph.add_conditional_edges(
    "agent",
    should_continue,
    {"tools": "tools", "end": END}
)
graph.add_edge("tools", "agent")    # after tools → back to agent

app = graph.compile()

# ── Run ───────────────────────────────────────────────────────────────────────

result = app.invoke({
    "messages": [HumanMessage("Create a caption and hashtags about AI automation")]
})

print(result["messages"][-1].content)
```

### What the graph looks like

```
        [START]
           │
           ▼
        [agent]  ◄─────────────┐
           │                   │
    tool calls?                │
     yes │   no               │
         ▼   ▼               │
      [tools] [END]           │
         │                    │
         └────────────────────┘
```

---

## 2. Richer State

Add more fields to track task progress:

```python
from typing import TypedDict, Annotated, Optional
import operator

class CreatorState(TypedDict):
    messages: Annotated[list, operator.add]
    topic: str                      # set once at the start
    research_done: bool             # progress flag
    caption: Optional[str]          # collected output
    hashtags: Optional[str]         # collected output
    step_count: int                 # guard against loops
```

Nodes can read and write any field:

```python
def extract_outputs(state: CreatorState) -> CreatorState:
    """Parse tool results out of messages into dedicated state fields."""
    updates = {}
    for msg in state["messages"]:
        if isinstance(msg, ToolMessage):
            if "caption" in msg.content.lower():
                updates["caption"] = msg.content
            if "#" in msg.content:
                updates["hashtags"] = msg.content
    return updates
```

---

## 3. Persistent State (Checkpointing)

Save the graph state between invocations — sessions survive process restarts.

```python
from langgraph.checkpoint.memory import MemorySaver   # in-memory (dev)
# from langgraph.checkpoint.sqlite import SqliteSaver # SQLite (prod-ish)
# from langgraph.checkpoint.postgres import PostgresSaver # Postgres (prod)

checkpointer = MemorySaver()
app = graph.compile(checkpointer=checkpointer)

# Every invocation needs a thread_id — this is the "session" identifier
config = {"configurable": {"thread_id": "user_alex_session_1"}}

# Turn 1
app.invoke({"messages": [HumanMessage("Research AI trends")]}, config=config)

# Turn 2 — state is automatically loaded from the checkpoint
result = app.invoke(
    {"messages": [HumanMessage("Now write a caption based on that research")]},
    config=config
)
```

This is how you build agents that **remember context across page refreshes or
server restarts** — something `AgentExecutor` cannot do.

---

## 4. Human-in-the-Loop

Pause execution before a node, let a human review, then resume.

```python
app = graph.compile(
    checkpointer=MemorySaver(),
    interrupt_before=["tools"],    # pause BEFORE running any tool
)

config = {"configurable": {"thread_id": "review_session"}}

# Run until the interrupt
state = app.invoke(
    {"messages": [HumanMessage("Post the caption to Instagram")]},
    config=config
)

# At this point execution is paused. Show the pending tool call to the user:
last = state["messages"][-1]
print(f"Agent wants to call: {last.tool_calls}")

# Human approves:
approved = input("Approve? (y/n): ") == "y"

if approved:
    # Resume — pass None as input, state is loaded from checkpoint
    final = app.invoke(None, config=config)
else:
    # Inject a rejection and let the agent adapt
    final = app.invoke(
        {"messages": [HumanMessage("Don't post yet, revise first.")]},
        config=config
    )
```

---

## 5. Branching — Different Paths Based on State

Route to different nodes based on what happened:

```python
def route_after_research(state: CreatorState) -> str:
    """Choose next step based on research quality."""
    last_tool_result = state["messages"][-1].content

    if "error" in last_tool_result.lower():
        return "handle_error"

    if len(last_tool_result) < 100:
        return "retry_research"    # not enough info

    return "generate_content"      # enough info, proceed

graph.add_conditional_edges(
    "research",
    route_after_research,
    {
        "handle_error": "error_node",
        "retry_research": "research",       # loop back
        "generate_content": "content_node",
    }
)
```

---

## 6. Parallel Branches (Fan-out / Fan-in)

Run multiple nodes at the same time, merge results:

```python
from langgraph.graph import StateGraph, END, START

class ParallelState(TypedDict):
    topic: str
    messages: Annotated[list, operator.add]
    caption: Optional[str]
    hashtags: Optional[str]
    image_idea: Optional[str]

def gen_caption(state):
    result = llm.invoke(f"Write a caption about {state['topic']}")
    return {"caption": result.content}

def gen_hashtags(state):
    result = llm.invoke(f"Write hashtags for {state['topic']}")
    return {"hashtags": result.content}

def gen_image_idea(state):
    result = llm.invoke(f"Describe an image for {state['topic']}")
    return {"image_idea": result.content}

def combine(state):
    print("Caption:", state["caption"])
    print("Hashtags:", state["hashtags"])
    print("Image:", state["image_idea"])
    return {}

graph = StateGraph(ParallelState)
graph.add_node("caption", gen_caption)
graph.add_node("hashtags", gen_hashtags)
graph.add_node("image", gen_image_idea)
graph.add_node("combine", combine)

# Fan-out: START → all three in parallel
graph.add_edge(START, "caption")
graph.add_edge(START, "hashtags")
graph.add_edge(START, "image")

# Fan-in: all three → combine
graph.add_edge("caption", "combine")
graph.add_edge("hashtags", "combine")
graph.add_edge("image", "combine")

graph.add_edge("combine", END)

app = graph.compile()
app.invoke({"topic": "AI automation", "messages": [], "caption": None, "hashtags": None, "image_idea": None})
```

---

## 7. Upgrading Your Creator Agent to LangGraph

Your current `app/agent/agent.py` uses `AgentExecutor`. Here is what the
LangGraph version would look like — same tools, more control:

```python
# app/agent/graph_agent.py  (what it would look like)
from typing import TypedDict, Annotated
import operator

from langchain_core.messages import BaseMessage, HumanMessage, ToolMessage
from langgraph.graph import StateGraph, END
from langgraph.checkpoint.memory import MemorySaver

from app.core.llm_factory import get_llm
from app.tools.caption_tool import generate_caption
from app.tools.hashtag_tool import generate_hashtags
from app.tools.image_idea_tool import generate_image_idea
from app.tools.reel_tool import generate_reel_script
from app.tools.research_tool import research_trending_topics
from app.prompts.prompts import AGENT_SYSTEM_PROMPT

TOOLS = [research_trending_topics, generate_caption,
         generate_hashtags, generate_reel_script, generate_image_idea]
TOOL_MAP = {t.name: t for t in TOOLS}

class State(TypedDict):
    messages: Annotated[list[BaseMessage], operator.add]

def call_model(state: State) -> State:
    llm = get_llm().bind_tools(TOOLS)
    response = llm.invoke(state["messages"])
    return {"messages": [response]}

def run_tools(state: State) -> State:
    last = state["messages"][-1]
    results = [
        ToolMessage(
            content=str(TOOL_MAP[call["name"]].invoke(call["args"])),
            tool_call_id=call["id"],
        )
        for call in last.tool_calls
    ]
    return {"messages": results}

def should_continue(state: State) -> str:
    last = state["messages"][-1]
    return "tools" if (hasattr(last, "tool_calls") and last.tool_calls) else "end"

graph = StateGraph(State)
graph.add_node("agent", call_model)
graph.add_node("tools", run_tools)
graph.set_entry_point("agent")
graph.add_conditional_edges("agent", should_continue, {"tools": "tools", "end": END})
graph.add_edge("tools", "agent")

# Compile with memory for multi-turn sessions
creator_graph = graph.compile(checkpointer=MemorySaver())

def run_creator(user_input: str, session_id: str = "default") -> str:
    from langchain_core.messages import SystemMessage
    config = {"configurable": {"thread_id": session_id}}
    result = creator_graph.invoke(
        {"messages": [SystemMessage(AGENT_SYSTEM_PROMPT), HumanMessage(user_input)]},
        config=config,
    )
    return result["messages"][-1].content
```

**What you gain over the current code:**
- Sessions persist — user can say "make it shorter" in a new browser tab
- You can add `interrupt_before=["tools"]` for content approval
- You can add conditional routing (e.g. skip research if topic is already known)

---

## 8. Visualising the Graph

```python
# Print the graph as ASCII
print(app.get_graph().draw_ascii())

# Or export as PNG (needs graphviz)
png = app.get_graph().draw_mermaid_png()
with open("graph.png", "wb") as f:
    f.write(png)
```

---

## When to Use Which

```
Simple request/response + a few tools
  → AgentExecutor (what you have now) ✓

Need multi-turn memory across sessions
  → LangGraph + MemorySaver

Need human approval before posting/sending
  → LangGraph + interrupt_before

Need parallel content generation (caption + hashtags + image at once)
  → LangGraph fan-out/fan-in

Complex routing (research → branch → generate → review → publish)
  → LangGraph with conditional edges
```

---

## Key Takeaways

- LangGraph = nodes (functions) + edges (transitions) + shared state.
- `operator.add` on a list field = append, not overwrite.
- Checkpointers give you persistent memory for free.
- `interrupt_before` pauses the graph for human review.
- Fan-out / fan-in runs subtasks in parallel.
- Your current `AgentExecutor` maps directly to a two-node LangGraph (`agent` → `tools` → `agent`).

**You've now completed the full curriculum.** Go build!
