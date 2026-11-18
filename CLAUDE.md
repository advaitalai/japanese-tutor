# Yui

A voice-first Japanese conversation partner for one learner, Advait (JLPT N5, Tokyo). Built as a PWA for his Android phone and MacBook.

## Read first

- `docs/spec.md`: what v0 is. This is the source of truth for scope and behavior. Advait reviews and comments on a copy in Claude Docs (https://claude.ai/artifact/QeCT2BZ3avdraowxUA56wq); keep both in sync when the spec changes.
- HLD (high-level design): https://claude.ai/artifact/VwXSz5XGjnnGxz3Kyo4NQX (Claude Docs). Architecture, turn flow, vendors, hosting, costs. Still a draft until Advait signs off.
- `docs/decisions.md`: why things are the way they are. Check it before proposing something that was already tried and cut.
- `docs/prompts.md`: Yui's conversation prompt and the grading prompt from the v0.9 prototype, plus the rules the prototype enforced in code.
- `docs/problem-statement.md`: the original problem framing. Where it disagrees with the spec, the spec wins.
- `docs/playbook.md`: setup, QA and deploy lessons from the date planner project. Strong guidelines, not hard rules.

## How to work here

- Start non-trivial work in plan mode and propose a plan before editing.
- Don't add scope beyond `docs/spec.md`. Ideas go to the Backlog table in the spec.
- When Advait makes a product decision in a session, add it to `docs/decisions.md` with the reason.
- Rules that must never depend on the model (goodbye detection, no fixes in sidebars, false-fix filtering, accuracy counting, mastery) live in code, with tests.
- Japanese readings and word splitting come from a tokenizer, not the model.

## Design

- Screens are designed as a clickable HTML mockup in `design/mockup.html`, published as a private claude.ai page. Change it before building a screen.
- Stitch is still in `.mcp.json`. It works from a local Claude Code session, but not from cloud sessions: the network proxy cuts calls after about 30 seconds, and generating a screen takes longer.
- Screens and states are listed in the Screens section of `docs/spec.md`.

## Writing style

Advait dislikes text that reads as AI-generated. In docs, UI copy and messages to him: plain, short sentences, no em dashes.
