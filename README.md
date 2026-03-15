# 🚀 Creator Agent — AI Instagram Content Generator

An AI-powered agent that automatically generates **production-ready Instagram content** using LangChain, structured tools, and a configurable LLM backend (Google Gemini or OpenAI).

---

## ✨ Features

| Feature | Description |
|---|---|
| **Caption Generator** | Scroll-stopping captions with hooks, storytelling & CTAs |
| **Hashtag Generator** | Curated mix of broad, medium & niche hashtags |
| **Reel Script Writer** | 30-60s scripts with scene markers & on-screen text cues |
| **Image Idea Suggester** | Detailed visual concepts with mood, palette & overlay ideas |
| **Trend Researcher** | Live DuckDuckGo search for trending topics & angles |

---

## 🏗️ Architecture

```
User Input
    │
    ▼
┌──────────────────┐
│  Creator Agent   │  ← LangChain Structured-Chat Agent
│  (AgentExecutor) │
└──────┬───────────┘
       │  Selects & calls tools based on reasoning
       ▼
┌──────────────────────────────────────────────┐
│  Tools                                       │
│  ┌──────────┐ ┌──────────┐ ┌──────────────┐ │
│  │ Research  │ │ Caption  │ │  Hashtags    │ │
│  └──────────┘ └──────────┘ └──────────────┘ │
│  ┌──────────┐ ┌──────────────┐               │
│  │  Reel    │ │  Image Idea  │               │
│  └──────────┘ └──────────────┘               │
└──────────────────────────────────────────────┘
       │
       ▼
  Formatted Instagram Content
```

The agent follows a **ReAct** (Reason + Act) loop:

1. Receives user input
2. Reasons about which tool to call next
3. Executes the tool
4. Observes the result
5. Repeats until all content is generated

---

## 📂 Project Structure

```
CreatorAgent/
├── app/
│   ├── agent/
│   │   └── agent.py          # Agent assembly
│   ├── config/
│   │   └── settings.py       # Centralized configuration
│   ├── core/
│   │   └── llm_factory.py    # Configurable LLM factory
│   ├── prompts/
│   │   └── prompts.py        # All prompt templates
│   ├── tools/
│   │   ├── caption_tool.py
│   │   ├── hashtag_tool.py
│   │   ├── reel_tool.py
│   │   ├── image_idea_tool.py
│   │   └── research_tool.py
│   └── main.py               # CLI entry point
├── tests/
│   └── test_agent.py
├── requirements.txt
├── .env.example
├── .gitignore
└── README.md
```

---

## 🛠️ Installation

### 1. Clone the repository

```bash
git clone <your-repo-url>
cd CreatorAgent
```

### 2. Create a virtual environment

```bash
python -m venv venv
source venv/bin/activate   # macOS / Linux
# venv\Scripts\activate    # Windows
```

### 3. Install dependencies

```bash
pip install -r requirements.txt
```

### 4. Configure your API key

```bash
cp .env.example .env
```

Edit `.env` and add your API key:

```env
# Use Gemini (default)
LLM_PROVIDER=gemini
GOOGLE_API_KEY=your-key-here
MODEL_NAME=gemini-2.0-flash

# — OR use OpenAI —
# LLM_PROVIDER=openai
# OPENAI_API_KEY=your-key-here
# MODEL_NAME=gpt-4o-mini
```

---

## 🚀 Running the Agent

```bash
python app/main.py
```

You'll see an interactive prompt:

```
────────────────────────────────────────────────────────────
   🚀  Creator Agent — Instagram Content Generator
────────────────────────────────────────────────────────────
   Powered by LangChain  •  Type 'quit' to exit
────────────────────────────────────────────────────────────
✅  Agent loaded successfully!

You ▸
```

---

## 💡 Example Usage

**Prompt:**

```
You ▸ Create an Instagram post about AI agents
```

**Output:**

```
────────────────────────────────────────────────────────────
📸  CREATOR AGENT OUTPUT
────────────────────────────────────────────────────────────

📝 CAPTION
Stop satisfying. Start automating. 🤖

AI agents aren't just a buzzword — they're your new team members
that work 24/7, never complain, and learn on the job…
[Save this for later 🔖]

#️⃣ HASHTAGS
#AIAgents #ArtificialIntelligence #Automation #TechTrends
#MachineLearning #FutureOfWork #AITools #ProductivityHacks …

🎬 REEL SCRIPT
SCENE 1 — [On-screen: "What if your assistant never slept?"]
(Hook) "You're still doing THIS manually?"
SCENE 2 — …

🖼️ IMAGE IDEA
A minimal split-screen composition: left side shows a human at
a cluttered desk (warm amber tones), right side shows a sleek
AI dashboard (cool blue-purple gradient)…
────────────────────────────────────────────────────────────
```

---

## 🧪 Running Tests

```bash
python -m pytest tests/ -v
```

Tests run **without an API key** — they validate configuration, tool definitions, and prompt templates.

---

## ⚙️ Configuration Reference

| Variable | Default | Description |
|---|---|---|
| `LLM_PROVIDER` | `gemini` | LLM backend: `gemini` or `openai` |
| `GOOGLE_API_KEY` | — | Google AI Studio API key |
| `OPENAI_API_KEY` | — | OpenAI API key |
| `MODEL_NAME` | `gemini-2.0-flash` | Model identifier |
| `TEMPERATURE` | `0.7` | Creativity (0.0 = focused, 1.0+ = creative) |
| `AGENT_MAX_ITERATIONS` | `10` | Max reasoning steps |
| `VERBOSE` | `true` | Print agent reasoning |

---

## 🔮 Future Improvements

- 📱 **Instagram Graph API** — publish posts directly
- 🎨 **AI Image Generation** — auto-generate visuals with DALL·E / Imagen
- 📊 **Analytics Dashboard** — track post performance
- 🗓️ **Content Calendar** — schedule posts in advance
- 🧠 **Memory** — remember brand voice across sessions
- 🌐 **Multi-platform** — extend to TikTok, LinkedIn, X (Twitter)

---

## 📄 License

MIT
