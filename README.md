# Yui

A voice-first Japanese conversation partner. Yui is a friendly character who talks with you in Japanese at your level, corrects every mistake on screen, and switches to English only when you ask about the language.

Built as a PWA for one learner (JLPT N5, Tokyo), for Android and macOS.

## Status

Pre-build. The v0 spec and the decisions from prototypes v0 to v0.9 are written. No app code yet.

## Docs

| File | What it is |
| --- | --- |
| [docs/spec.md](docs/spec.md) | The v0 spec. Source of truth for scope and behavior. |
| [docs/decisions.md](docs/decisions.md) | Why things are the way they are. |
| [docs/prompts.md](docs/prompts.md) | Yui's conversation and grading prompts from the v0.9 prototype. |
| [docs/problem-statement.md](docs/problem-statement.md) | The original problem framing. |
| [docs/playbook.md](docs/playbook.md) | Setup and QA conventions. To fill in. |

## Working with Claude Code

`CLAUDE.md` has the working rules for Claude Code sessions in this repo. `.mcp.json` connects Stitch for screen design.

## Next steps

1. Fill in `docs/playbook.md` from the date planner project.
2. Pick speech-to-text and text-to-speech providers with good Japanese.
3. Choose hosting, auth and storage.
4. Set a latency budget per turn (about 1.5 seconds until Yui starts speaking).
