# Module 7 – Orchestration Frameworks

## Why Use a Framework?

Building agents from scratch is instructive (see modules 1–6) but production systems need:
- Reliable retry logic
- Tracing and observability
- Pre-built tool integrations
- Graph-based control flow
- Human-in-the-loop support

Frameworks handle all of this so you focus on the logic.

---

## The Main Frameworks

| Framework | Language | Best for |
|-----------|----------|----------|
| **LangChain / LangGraph** | Python, JS | General-purpose, huge ecosystem |
| **LlamaIndex** | Python | RAG-heavy applications |
| **CrewAI** | Python | Role-based multi-agent teams |
| **Anthropic Agent SDK** | Python | Claude-native, simple & clean |
| **AutoGen** | Python | Conversational multi-agent |

---

## 1. LangGraph – Stateful Agent Graphs

LangGraph models your agent as a directed graph of nodes.

```bash
pip install langgraph langchain-anthropic
```

```python
from typing import TypedDict, Annotated
from langgraph.graph import StateGraph, END
from langchain_anthropic import ChatAnthropic
from langchain_core.messages import HumanMessage, AIMessage
import operator

# Define state
class AgentState(TypedDict):
    messages: Annotated[list, operator.add]
    step_count: int

# Initialize model
llm = ChatAnthropic(model="claude-sonnet-4-6")

# Define nodes
def call_model(state: AgentState) -> AgentState:
    response = llm.invoke(state["messages"])
    return {
        "messages": [response],
        "step_count": state["step_count"] + 1
    }

def should_continue(state: AgentState) -> str:
    last_message = state["messages"][-1]
    if state["step_count"] >= 5:
        return "end"
    if hasattr(last_message, "tool_calls") and last_message.tool_calls:
        return "tools"
    return "end"

def run_tools(state: AgentState) -> AgentState:
    # process tool calls here
    return state

# Build graph
graph = StateGraph(AgentState)
graph.add_node("agent", call_model)
graph.add_node("tools", run_tools)
graph.set_entry_point("agent")
graph.add_conditional_edges("agent", should_continue, {"tools": "tools", "end": END})
graph.add_edge("tools", "agent")

app = graph.compile()

# Run
result = app.invoke({
    "messages": [HumanMessage(content="What is 25 * 48?")],
    "step_count": 0
})
print(result["messages"][-1].content)
```

### LangGraph with Checkpointing (Persistent State)

```python
from langgraph.checkpoint.memory import MemorySaver

# Saves state between invocations
memory = MemorySaver()
app = graph.compile(checkpointer=memory)

config = {"configurable": {"thread_id": "user_123"}}

# First message
app.invoke({"messages": [HumanMessage("My name is Alex")]}, config=config)

# Second message — agent remembers "Alex"
result = app.invoke({"messages": [HumanMessage("What's my name?")]}, config=config)
print(result["messages"][-1].content)
```

---

## 2. CrewAI – Role-Based Agent Teams

```bash
pip install crewai crewai-tools
```

```python
from crewai import Agent, Task, Crew, Process
from crewai_tools import SerperDevTool

search_tool = SerperDevTool()

# Define agents with roles
researcher = Agent(
    role="Senior Research Analyst",
    goal="Find accurate and up-to-date information on assigned topics",
    backstory="You're an expert researcher with a talent for finding reliable sources.",
    tools=[search_tool],
    llm="claude-sonnet-4-6",
    verbose=True,
)

writer = Agent(
    role="Content Writer",
    goal="Write engaging, accurate content based on research",
    backstory="You transform complex research into clear, compelling narratives.",
    llm="claude-sonnet-4-6",
    verbose=True,
)

editor = Agent(
    role="Editor",
    goal="Ensure content is polished, accurate, and publication-ready",
    backstory="You have a sharp eye for detail and excellent editorial judgment.",
    llm="claude-sonnet-4-6",
)

# Define tasks
research_task = Task(
    description="Research the current state of agentic AI in 2025. Focus on key trends and real-world applications.",
    expected_output="A detailed research brief with key findings, statistics, and sources.",
    agent=researcher,
)

writing_task = Task(
    description="Write a 500-word blog post based on the research brief.",
    expected_output="A polished blog post ready for publication.",
    agent=writer,
    context=[research_task],  # depends on research
)

editing_task = Task(
    description="Edit the blog post for clarity, accuracy, and style.",
    expected_output="Final, publication-ready blog post.",
    agent=editor,
    context=[writing_task],
)

# Run crew
crew = Crew(
    agents=[researcher, writer, editor],
    tasks=[research_task, writing_task, editing_task],
    process=Process.sequential,  # or Process.hierarchical
    verbose=True,
)

result = crew.kickoff()
print(result)
```

---

## 3. Anthropic Agent SDK (claude_agent_sdk)

The official Anthropic SDK for building Claude-native agents with a clean API.

```bash
pip install claude-agent-sdk
```

```python
from claude_agent_sdk import Agent, tool

# Define tools with decorator
@tool
def get_weather(city: str) -> str:
    """Get current weather for a city."""
    return f"Weather in {city}: 22°C, sunny"

@tool
def search_flights(origin: str, destination: str, date: str) -> str:
    """Search for available flights."""
    return f"Found 3 flights from {origin} to {destination} on {date}"

# Create agent
agent = Agent(
    model="claude-sonnet-4-6",
    system="You are a helpful travel planning assistant.",
    tools=[get_weather, search_flights],
)

# Run synchronously
result = agent.run("I want to fly from NYC to Tokyo next week. What's the weather like there?")
print(result)

# Stream responses
for chunk in agent.stream("Plan a 5-day itinerary for Tokyo."):
    print(chunk, end="", flush=True)
```

---

## 4. Human-in-the-Loop

Stop agent execution for human approval before taking irreversible actions.

```python
from langgraph.graph import StateGraph, END
from langgraph.checkpoint.memory import MemorySaver

# Mark a node as requiring human approval
graph.add_node("human_approval", lambda state: state)  # passthrough node
graph.compile(
    checkpointer=MemorySaver(),
    interrupt_before=["human_approval"]  # pause here
)

config = {"configurable": {"thread_id": "session_1"}}

# Run until interrupt
result = app.invoke({"messages": [...]}, config=config)
# → execution stops before "human_approval"

# Show pending action to user
pending_action = result["pending_action"]
print(f"Agent wants to: {pending_action}")
approved = input("Approve? (y/n): ") == "y"

if approved:
    # Resume execution
    app.invoke(None, config=config)
else:
    # Inject rejection
    app.invoke({"messages": [HumanMessage("Action denied. Stop.")]}, config=config)
```

---

## 5. Observability with LangSmith

Trace every agent step for debugging and evaluation.

```python
import os
os.environ["LANGCHAIN_TRACING_V2"] = "true"
os.environ["LANGCHAIN_API_KEY"] = "your-langsmith-api-key"
os.environ["LANGCHAIN_PROJECT"] = "my-agent-project"

# All LangChain/LangGraph calls are now automatically traced
# View at: https://smith.langchain.com
```

For non-LangChain code, use manual tracing:

```python
from anthropic import Anthropic
client = Anthropic()

# Add metadata to track in your own logging system
response = client.messages.create(
    model="claude-sonnet-4-6",
    max_tokens=1024,
    messages=[{"role": "user", "content": "Hello"}],
    metadata={"user_id": "user_123", "session_id": "abc"}
)

# Log token usage, latency, etc.
import time
start = time.time()
# ... api call ...
latency = time.time() - start

print(f"Tokens: {response.usage.input_tokens} in / {response.usage.output_tokens} out")
print(f"Latency: {latency:.2f}s")
```

---

## Choosing a Framework

```
Simple chatbot with tools?
  → Use Anthropic SDK directly (Module 2-3)

Complex stateful agent with branching logic?
  → LangGraph

Research team with specialized roles?
  → CrewAI

RAG-heavy application?
  → LlamaIndex

Claude-native, minimal boilerplate?
  → Anthropic Agent SDK
```

---

## Key Takeaways

- Frameworks add retry, tracing, and state management out of the box.
- LangGraph models agents as graphs — great for complex control flow.
- CrewAI makes role-based multi-agent teams easy to express.
- Human-in-the-loop stops execution for approval before risky actions.
- Add tracing (LangSmith or custom) from day one — you'll need it.

**Next:** [08 – Evaluation & Reliability](08_evaluation.md)
