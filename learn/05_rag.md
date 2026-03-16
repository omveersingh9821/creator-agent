# Module 5 – RAG: Retrieval Augmented Generation

## What is RAG?

RAG is a pattern where you retrieve relevant documents from a knowledge base and inject them into the model's context before it generates a response.

```
user query
     ↓
  [Retriever] ← vector search over your documents
     ↓
relevant chunks
     ↓
  [LLM] with query + chunks → grounded answer
```

**Why:** LLMs hallucinate when they don't know something. RAG grounds answers in real data without retraining.

---

## The RAG Pipeline

### Step 1 – Ingest & Index

```python
# pip install chromadb sentence-transformers
import chromadb
from chromadb.utils import embedding_functions

client_db = chromadb.PersistentClient(path="./rag_db")
ef = embedding_functions.DefaultEmbeddingFunction()

collection = client_db.get_or_create_collection(
    name="knowledge_base",
    embedding_function=ef,
)

# Your documents (could be loaded from files, a website, a DB, etc.)
documents = [
    "Claude is an AI assistant made by Anthropic, founded in 2021.",
    "The context window for Claude Sonnet 4.6 is 200,000 tokens.",
    "Tool calling allows Claude to invoke external functions and APIs.",
    "RAG stands for Retrieval Augmented Generation.",
    "Anthropic's mission is the responsible development of AI for long-term benefit.",
]

collection.add(
    documents=documents,
    ids=[f"doc_{i}" for i in range(len(documents))],
)
print(f"Indexed {len(documents)} documents")
```

### Step 2 – Retrieve

```python
def retrieve(query: str, n_results: int = 3) -> list[str]:
    results = collection.query(query_texts=[query], n_results=n_results)
    return results["documents"][0]

chunks = retrieve("What is the context window size of Claude?")
print(chunks)
# → ["The context window for Claude Sonnet 4.6 is 200,000 tokens.", ...]
```

### Step 3 – Generate

```python
import anthropic

client = anthropic.Anthropic()

def rag_answer(question: str) -> str:
    chunks = retrieve(question, n_results=3)
    context = "\n\n".join(f"[Source {i+1}]: {c}" for i, c in enumerate(chunks))

    response = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=1024,
        system=f"""You are a helpful assistant. Answer ONLY based on the provided context.
If the answer is not in the context, say "I don't have that information."

Context:
{context}""",
        messages=[{"role": "user", "content": question}],
    )
    return response.content[0].text

print(rag_answer("How many tokens can Claude handle at once?"))
```

---

## Chunking Strategies

Documents must be split into chunks before embedding. Chunk size matters.

```python
def chunk_text(text: str, chunk_size: int = 500, overlap: int = 50) -> list[str]:
    """Simple character-based chunking with overlap."""
    chunks = []
    start = 0
    while start < len(text):
        end = start + chunk_size
        chunks.append(text[start:end])
        start += chunk_size - overlap
    return chunks

# Better: sentence-aware chunking
import re

def sentence_chunk(text: str, max_chars: int = 600) -> list[str]:
    sentences = re.split(r'(?<=[.!?])\s+', text)
    chunks, current = [], ""
    for sentence in sentences:
        if len(current) + len(sentence) > max_chars and current:
            chunks.append(current.strip())
            current = sentence
        else:
            current += " " + sentence
    if current:
        chunks.append(current.strip())
    return chunks
```

| Strategy | Good for |
|----------|----------|
| Fixed-size character | Simple, fast |
| Sentence-aware | Better coherence |
| Paragraph | Structured documents |
| Semantic (embeddings) | Best quality, slower |

---

## Loading Real Documents

```python
import pathlib

def ingest_directory(directory: str, extension: str = ".txt"):
    """Ingest all text files from a directory."""
    docs, ids, metadatas = [], [], []

    for path in pathlib.Path(directory).rglob(f"*{extension}"):
        text = path.read_text(encoding="utf-8")
        chunks = sentence_chunk(text)

        for i, chunk in enumerate(chunks):
            docs.append(chunk)
            ids.append(f"{path.stem}_{i}")
            metadatas.append({"file": str(path), "chunk": i})

    collection.add(documents=docs, ids=ids, metadatas=metadatas)
    print(f"Ingested {len(docs)} chunks from {directory}")

# For PDFs: pip install pymupdf
import fitz  # PyMuPDF

def load_pdf(path: str) -> str:
    doc = fitz.open(path)
    return "\n".join(page.get_text() for page in doc)
```

---

## RAG as an Agent Tool

The most powerful pattern: give the agent a `search_knowledge_base` tool so it decides when to retrieve.

```python
import json

def search_knowledge_base(query: str, n_results: int = 3) -> str:
    chunks = retrieve(query, n_results=n_results)
    return json.dumps({"results": chunks, "count": len(chunks)})

RAG_TOOL = {
    "name": "search_knowledge_base",
    "description": (
        "Search the internal knowledge base for relevant information. "
        "Use this before answering any factual question."
    ),
    "input_schema": {
        "type": "object",
        "properties": {
            "query": {"type": "string", "description": "Search query"},
            "n_results": {"type": "integer", "default": 3}
        },
        "required": ["query"]
    }
}
```

The agent will call `search_knowledge_base` when it needs information, then use the retrieved chunks to formulate its answer — automatically grounded in your data.

---

## Metadata Filtering

Filter results by document type, date, author, etc.

```python
# When indexing, add metadata
collection.add(
    documents=["Q3 revenue was $4.2M", "Q4 revenue was $5.1M"],
    ids=["q3_rev", "q4_rev"],
    metadatas=[{"quarter": "Q3", "year": 2024}, {"quarter": "Q4", "year": 2024}]
)

# Filter at query time
results = collection.query(
    query_texts=["What was our revenue?"],
    n_results=1,
    where={"quarter": "Q4"}  # only search Q4 documents
)
```

---

## Evaluating RAG Quality

```python
# Three metrics to track:
# 1. Retrieval precision – are the retrieved chunks relevant?
# 2. Answer faithfulness – does the answer use only retrieved facts?
# 3. Answer correctness – is the answer actually right?

def evaluate_rag(question: str, expected_answer: str):
    retrieved = retrieve(question)
    answer = rag_answer(question)

    # Use an LLM as a judge
    judge_response = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=256,
        messages=[{
            "role": "user",
            "content": f"""Rate this RAG answer from 1-5 on faithfulness and correctness.

Question: {question}
Expected: {expected_answer}
Retrieved context: {retrieved}
Generated answer: {answer}

Respond as JSON: {{"faithfulness": int, "correctness": int, "reason": str}}"""
        }]
    )
    return judge_response.content[0].text
```

---

## Key Takeaways

- RAG = retrieve relevant chunks → inject into context → generate grounded answer.
- Index quality (chunking, metadata) determines retrieval quality.
- Use RAG as an agent tool for the most flexible architecture.
- Always cite sources and stay within retrieved context to prevent hallucination.

**Next:** [06 – Multi-Agent Systems](06_multi_agent.md)
