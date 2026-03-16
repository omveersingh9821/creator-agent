# Module 6 – Multi-Agent Systems

## Why Multiple Agents?

A single agent has limits:
- Context window fills up on long tasks
- One model can't specialize in everything
- Sequential tasks are slow — agents can run in parallel

Multi-agent systems split work across **specialized agents** coordinated by an **orchestrator**.

```
User → [Orchestrator] → [Research Agent]
                      → [Code Agent]
                      → [Review Agent]
                      ↓
                  Final Answer
```

---

## Patterns

| Pattern | Description | When to use |
|---------|-------------|-------------|
| **Supervisor** | One orchestrator delegates to workers | Complex tasks with distinct subtasks |
| **Pipeline** | Agents chain sequentially (A → B → C) | Multi-stage workflows |
| **Debate** | Multiple agents argue, a judge decides | High-stakes decisions |
| **Parallel** | Same task, multiple agents, then merge | Speed, cross-checking |
| **Swarm** | Agents self-select tasks from a queue | Open-ended research |

---

## Pattern 1: Supervisor + Workers

```python
import anthropic, json, concurrent.futures

client = anthropic.Anthropic()

# ── Worker Agents ─────────────────────────────────────────────────────────

def research_agent(topic: str) -> str:
    """Gathers facts about a topic."""
    response = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=1024,
        system="You are a research analyst. Provide factual, concise information.",
        messages=[{"role": "user", "content": f"Research this topic: {topic}"}],
    )
    return response.content[0].text

def writer_agent(research: str, format: str) -> str:
    """Turns research into polished content."""
    response = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=2048,
        system="You are a professional writer. Write clearly and engagingly.",
        messages=[{
            "role": "user",
            "content": f"Write a {format} based on this research:\n\n{research}"
        }],
    )
    return response.content[0].text

def critic_agent(content: str) -> str:
    """Reviews content for quality and accuracy."""
    response = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=512,
        system="You are a critical editor. Be specific and constructive.",
        messages=[{
            "role": "user",
            "content": f"Review this content. Rate 1-10 and list improvements:\n\n{content}"
        }],
    )
    return response.content[0].text

# ── Orchestrator ──────────────────────────────────────────────────────────

ORCHESTRATOR_TOOLS = [
    {
        "name": "delegate_research",
        "description": "Ask the research agent to gather information on a topic.",
        "input_schema": {
            "type": "object",
            "properties": {"topic": {"type": "string"}},
            "required": ["topic"]
        }
    },
    {
        "name": "delegate_writing",
        "description": "Ask the writer agent to produce content from research.",
        "input_schema": {
            "type": "object",
            "properties": {
                "research": {"type": "string"},
                "format": {"type": "string", "description": "e.g. 'blog post', 'summary', 'email'"}
            },
            "required": ["research", "format"]
        }
    },
    {
        "name": "delegate_review",
        "description": "Ask the critic agent to review content.",
        "input_schema": {
            "type": "object",
            "properties": {"content": {"type": "string"}},
            "required": ["content"]
        }
    }
]

TOOL_DISPATCH = {
    "delegate_research": lambda i: research_agent(i["topic"]),
    "delegate_writing": lambda i: writer_agent(i["research"], i["format"]),
    "delegate_review": lambda i: critic_agent(i["content"]),
}

def orchestrate(user_goal: str) -> str:
    messages = [{"role": "user", "content": user_goal}]

    while True:
        response = client.messages.create(
            model="claude-sonnet-4-6",
            max_tokens=2048,
            system=(
                "You are an orchestrator. Break down the user's goal into steps "
                "and delegate to specialist agents using the provided tools."
            ),
            tools=ORCHESTRATOR_TOOLS,
            messages=messages,
        )

        if response.stop_reason == "end_turn":
            return response.content[0].text

        tool_results = []
        for block in response.content:
            if block.type == "tool_use":
                print(f"[orchestrator] → {block.name}")
                result = TOOL_DISPATCH[block.name](block.input)
                tool_results.append({
                    "type": "tool_result",
                    "tool_use_id": block.id,
                    "content": result,
                })

        messages.append({"role": "assistant", "content": response.content})
        messages.append({"role": "user", "content": tool_results})


result = orchestrate("Write a short blog post about the benefits of RAG for AI applications.")
print(result)
```

---

## Pattern 2: Parallel Agents

Run independent subtasks simultaneously using threads.

```python
from concurrent.futures import ThreadPoolExecutor, as_completed

def analyze_sentiment(text: str) -> dict:
    r = client.messages.create(
        model="claude-haiku-4-5-20251001",
        max_tokens=128,
        messages=[{"role": "user", "content": f"Sentiment of this text (positive/negative/neutral + score 0-1):\n{text}"}]
    )
    return {"task": "sentiment", "result": r.content[0].text}

def extract_entities(text: str) -> dict:
    r = client.messages.create(
        model="claude-haiku-4-5-20251001",
        max_tokens=256,
        messages=[{"role": "user", "content": f"Extract people, orgs, and locations from:\n{text}\nReturn JSON."}]
    )
    return {"task": "entities", "result": r.content[0].text}

def summarize(text: str) -> dict:
    r = client.messages.create(
        model="claude-haiku-4-5-20251001",
        max_tokens=256,
        messages=[{"role": "user", "content": f"Summarize in 2 sentences:\n{text}"}]
    )
    return {"task": "summary", "result": r.content[0].text}


def analyze_document(text: str) -> dict:
    tasks = [analyze_sentiment, extract_entities, summarize]
    results = {}

    with ThreadPoolExecutor(max_workers=3) as executor:
        futures = {executor.submit(fn, text): fn.__name__ for fn in tasks}
        for future in as_completed(futures):
            data = future.result()
            results[data["task"]] = data["result"]

    return results

doc = "Apple CEO Tim Cook announced record quarterly earnings today in Cupertino."
analysis = analyze_document(doc)
for task, result in analysis.items():
    print(f"\n[{task}]\n{result}")
```

---

## Pattern 3: Agent Pipeline

Chain agents where each passes output to the next.

```python
from typing import TypedDict

class PipelineState(TypedDict):
    raw_input: str
    extracted_data: str
    validated_data: str
    final_output: str

def extraction_agent(state: PipelineState) -> PipelineState:
    r = client.messages.create(
        model="claude-haiku-4-5-20251001",
        max_tokens=512,
        messages=[{"role": "user", "content": f"Extract structured data as JSON:\n{state['raw_input']}"}]
    )
    state["extracted_data"] = r.content[0].text
    return state

def validation_agent(state: PipelineState) -> PipelineState:
    r = client.messages.create(
        model="claude-haiku-4-5-20251001",
        max_tokens=512,
        messages=[{"role": "user", "content": f"Validate this JSON and fix any issues:\n{state['extracted_data']}"}]
    )
    state["validated_data"] = r.content[0].text
    return state

def formatting_agent(state: PipelineState) -> PipelineState:
    r = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=512,
        messages=[{"role": "user", "content": f"Format this data into a readable report:\n{state['validated_data']}"}]
    )
    state["final_output"] = r.content[0].text
    return state

PIPELINE = [extraction_agent, validation_agent, formatting_agent]

def run_pipeline(raw_input: str) -> str:
    state: PipelineState = {
        "raw_input": raw_input,
        "extracted_data": "",
        "validated_data": "",
        "final_output": ""
    }
    for step in PIPELINE:
        print(f"Running {step.__name__}...")
        state = step(state)
    return state["final_output"]

result = run_pipeline("John Smith, 35, john@email.com, New York, Software Engineer")
print(result)
```

---

## Pattern 4: Debate & Judge

Two agents argue opposing positions; a judge picks the better answer.

```python
def debate(question: str) -> str:
    # Agent A argues FOR
    pro = client.messages.create(
        model="claude-sonnet-4-6", max_tokens=512,
        system="Argue strongly IN FAVOR of the proposition.",
        messages=[{"role": "user", "content": question}]
    ).content[0].text

    # Agent B argues AGAINST
    con = client.messages.create(
        model="claude-sonnet-4-6", max_tokens=512,
        system="Argue strongly AGAINST the proposition.",
        messages=[{"role": "user", "content": question}]
    ).content[0].text

    # Judge evaluates both
    verdict = client.messages.create(
        model="claude-sonnet-4-6", max_tokens=512,
        system="You are an impartial judge. Evaluate both arguments and give a final verdict.",
        messages=[{
            "role": "user",
            "content": f"Question: {question}\n\nPro argument:\n{pro}\n\nCon argument:\n{con}"
        }]
    ).content[0].text

    return verdict

print(debate("Should AI agents have persistent memory by default?"))
```

---

## Handoff Between Agents

Pass context cleanly when transferring control:

```python
@dataclass
class Handoff:
    from_agent: str
    to_agent: str
    context: str
    task: str

def handoff(state: Handoff) -> str:
    """Receive a handoff and continue the task."""
    response = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=1024,
        system=f"You are the {state.to_agent}. You are continuing a task handed off from {state.from_agent}.",
        messages=[{
            "role": "user",
            "content": f"Context so far:\n{state.context}\n\nYour task:\n{state.task}"
        }]
    )
    return response.content[0].text
```

---

## Key Takeaways

- Multi-agent systems let you parallelize work and use specialized models.
- Supervisor pattern: orchestrator delegates to workers via tools.
- Pipeline pattern: agents chain sequentially, passing state forward.
- Parallel pattern: run independent subtasks simultaneously with threads.
- Use cheaper/faster models (Haiku) for subtasks; save powerful models for orchestration.

**Next:** [07 – Orchestration Frameworks](07_orchestration.md)
