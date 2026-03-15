"""
Creator Agent — CLI entry point.

Run with:
    python app/main.py

Enter a topic or content idea, and the agent will produce a complete
Instagram content package (caption, hashtags, reel script, image idea).
Type 'quit' or 'exit' to stop.
"""

import sys

from app.agent.agent import create_agent  # pyre-ignore[21]


# ── Pretty-print helpers ─────────────────────────────────────────────────────

DIVIDER = "─" * 60
BANNER = f"""
{DIVIDER}
   🚀  Creator Agent — Instagram Content Generator
{DIVIDER}
   Powered by LangChain  •  Type 'quit' to exit
{DIVIDER}
"""


def _print_result(result: dict) -> None:  # type: ignore[type-arg]
    """Nicely format and print the agent's output."""
    output = result.get("output", "No output generated.")
    print(f"\n{DIVIDER}")
    print("📸  CREATOR AGENT OUTPUT")
    print(DIVIDER)
    print(output)
    print(DIVIDER)


# ── Main loop ────────────────────────────────────────────────────────────────

def main() -> None:
    """Run the interactive CLI loop."""
    print(BANNER)

    try:
        agent = create_agent()
    except ValueError as exc:
        print(f"\n❌  Configuration error: {exc}")
        print("   👉  Check your .env file and try again.\n")
        sys.exit(1)

    print("✅  Agent loaded successfully!\n")

    while True:
        try:
            user_input = input("You ▸ ").strip()
        except (KeyboardInterrupt, EOFError):
            print("\n\n👋  Goodbye!")
            break

        if not user_input:
            continue
        if user_input.lower() in {"quit", "exit", "q"}:
            print("\n👋  Goodbye!")
            break

        print("\n⏳  Working on it…\n")

        try:
            result = agent.invoke({"input": user_input})
            _print_result(result)
        except Exception as exc:
            print(f"\n❌  Agent error: {exc}\n")

        print()  # blank line before next prompt


if __name__ == "__main__":
    main()
