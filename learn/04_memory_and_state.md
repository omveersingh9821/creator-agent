# Module 4 – Memory & State

## The Problem

LLMs are stateless — every API call starts from scratch. For agents that run across multiple sessions or long conversations, you need to manage memory explicitly.

## Four Types of Memory

| Type | Where stored | Lifespan | Use case |
|------|-------------|----------|----------|
| **In-context** | messages array | Current session | Short conversations |
| **External (key-value)** | Redis / DB | Persistent | User profiles, facts |
| **Semantic (vector)** | Vector DB | Persistent | "What did we talk about?" |
| **Episodic (summary)** | DB + LLM | Persistent | Long-running agents |

---

## 1. In-Context Memory

The simplest form: just keep the messages list.

```python
class ConversationAgent:
    def __init__(self, system: str):
        self.system = system
        self.messages = []  # ← this IS the memory

    def chat(self, user_input: str) -> str:
        self.messages.append({"role": "user", "content": user_input})

        response = client.messages.create(
            model="claude-sonnet-4-6",
            max_tokens=1024,
            system=self.system,
            messages=self.messages,
        )

        reply = response.content[0].text
        self.messages.append({"role": "assistant", "content": reply})
        return reply

agent = ConversationAgent("You are a helpful coding assistant.")
print(agent.chat("My name is Alex."))
print(agent.chat("What's my name?"))  # remembers "Alex"
```

**Limitation:** Context window fills up → need to prune or summarize.

---

## 2. Sliding Window + Summarization

When the conversation gets long, summarize old turns into a single message.

```python
MAX_MESSAGES = 20

def compress_history(messages: list, system: str) -> list:
    if len(messages) <= MAX_MESSAGES:
        return messages

    # summarize the oldest half
    old = messages[:-MAX_MESSAGES // 2]
    recent = messages[-MAX_MESSAGES // 2:]

    summary_response = client.messages.create(
        model="claude-haiku-4-5-20251001",   # cheaper model for summarizing
        max_tokens=512,
        system="Summarize the following conversation concisely.",
        messages=old,
    )
    summary = summary_response.content[0].text

    # replace old messages with a single summary message
    return [
        {"role": "user", "content": f"[Conversation summary]: {summary}"},
        {"role": "assistant", "content": "Understood. Continuing from summary."},
        *recent
    ]
```

---

## 3. External Key-Value Memory

Store and retrieve facts about the user between sessions.

```python
import json, pathlib

# Simple file-based store (use Redis/DynamoDB in production)
class KeyValueMemory:
    def __init__(self, path: str = "memory.json"):
        self.path = pathlib.Path(path)
        self.store = json.loads(self.path.read_text()) if self.path.exists() else {}

    def set(self, key: str, value: str):
        self.store[key] = value
        self.path.write_text(json.dumps(self.store, indent=2))

    def get(self, key: str) -> str | None:
        return self.store.get(key)

    def all(self) -> dict:
        return self.store

memory = KeyValueMemory()

# expose as agent tools
def remember(key: str, value: str) -> str:
    memory.set(key, value)
    return json.dumps({"stored": {key: value}})

def recall(key: str) -> str:
    val = memory.get(key)
    return json.dumps({"key": key, "value": val or "not found"})

MEMORY_TOOLS = [
    {
        "name": "remember",
        "description": "Store a fact about the user for future reference.",
        "input_schema": {
            "type": "object",
            "properties": {
                "key": {"type": "string", "description": "e.g. 'user_name', 'preferred_language'"},
                "value": {"type": "string"}
            },
            "required": ["key", "value"]
        }
    },
    {
        "name": "recall",
        "description": "Retrieve a stored fact by key.",
        "input_schema": {
            "type": "object",
            "properties": {"key": {"type": "string"}},
            "required": ["key"]
        }
    }
]
```

Usage:
```python
# Session 1
agent.chat("My favorite language is Python.")  # model calls remember("favorite_language", "Python")

# Session 2 (new process, memory loaded from disk)
agent.chat("What's my favorite language?")     # model calls recall("favorite_language") → "Python"
```

---

## 4. Semantic Memory (Vector Search)

Find relevant past information by meaning, not exact key match.

```python
# pip install chromadb sentence-transformers
import chromadb
from chromadb.utils import embedding_functions

class SemanticMemory:
    def __init__(self):
        self.client = chromadb.PersistentClient(path="./chroma_db")
        ef = embedding_functions.DefaultEmbeddingFunction()
        self.collection = self.client.get_or_create_collection(
            name="agent_memory",
            embedding_function=ef
        )

    def store(self, text: str, metadata: dict = {}):
        import uuid
        self.collection.add(
            documents=[text],
            metadatas=[metadata],
            ids=[str(uuid.uuid4())]
        )

    def search(self, query: str, n_results: int = 3) -> list[str]:
        results = self.collection.query(
            query_texts=[query],
            n_results=n_results
        )
        return results["documents"][0]  # list of relevant texts

sem_mem = SemanticMemory()

# Store past interactions
sem_mem.store("User mentioned they're building a travel app in React.", {"type": "project"})
sem_mem.store("User prefers TypeScript over JavaScript.", {"type": "preference"})
sem_mem.store("User's team uses GitHub Actions for CI.", {"type": "tooling"})

# Retrieve relevant context
relevant = sem_mem.search("What framework is the user using?")
print(relevant)
# → ["User mentioned they're building a travel app in React."]
```

Inject retrieved memories into the system prompt:
```python
def build_system_with_memory(query: str) -> str:
    relevant = sem_mem.search(query)
    memory_block = "\n".join(f"- {m}" for m in relevant)
    return f"""You are a personal assistant.

Relevant things you remember about this user:
{memory_block}

Use this context when answering."""
```

---

## 5. Agent State Machine

For complex agents, track explicit state:

```python
from dataclasses import dataclass, field
from enum import Enum

class AgentState(Enum):
    IDLE = "idle"
    PLANNING = "planning"
    EXECUTING = "executing"
    WAITING_FOR_USER = "waiting_for_user"
    DONE = "done"

@dataclass
class AgentSession:
    session_id: str
    state: AgentState = AgentState.IDLE
    messages: list = field(default_factory=list)
    plan: list[str] = field(default_factory=list)
    completed_steps: list[str] = field(default_factory=list)
    facts: dict = field(default_factory=dict)

    def to_dict(self) -> dict:
        return {
            "session_id": self.session_id,
            "state": self.state.value,
            "messages": self.messages,
            "plan": self.plan,
            "completed_steps": self.completed_steps,
            "facts": self.facts,
        }

    @classmethod
    def from_dict(cls, data: dict) -> "AgentSession":
        data["state"] = AgentState(data["state"])
        return cls(**data)
```

---

## Key Takeaways

- In-context memory is simplest but limited by the context window.
- Summarize old turns to extend effective memory.
- Use a key-value store for structured facts that persist across sessions.
- Use a vector DB for fuzzy "what do I know about X?" queries.
- Model memory as explicit state for complex, long-running agents.

**Next:** [05 – RAG](05_rag.md)
