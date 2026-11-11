# Yui v0 Spec

Nov 11, 2026 · Advait

## Summary

v0 is a voice-first Japanese conversation partner called Yui, built for one customer: Advait. Opening the app goes straight to Yui, who leads a natural conversation pitched at his level, corrects every mistake on screen, and steps into English only when he asks about the language.

There is one continuous thread with Yui, split into sessions. A small profile shows talk time and a level score built from evidence across sessions.

North star: minutes of Japanese spoken per day. The behavior reference is the v0.9 prototype (its prompts are in `docs/prompts.md`); this doc records the decisions behind it.

## Customer, problem and vision

The customer is Advait: JLPT N5, living in Tokyo, working in English all day, with almost no speaking practice. He freezes in real conversations and falls back to English or Translate. He is driven by connecting with people and by becoming hireable as a bilingual professional, not by studying. Apps like Speak felt too scaffolded, and tutors never knew his level. The full problem statement is in `docs/problem-statement.md`.

Long-term vision: a companion he talks to daily, as a face, voice and expressions with almost no UI. It quietly runs a textbook-quality syllabus underneath, covers life admin, social and work Japanese, and pushes him toward real conversations with real people. A product for others is optional and later.

## v0 scope

v0 proves one thing: he comes back to talk to Yui most days, and her Japanese stays at his level.

In:

- Voice conversation with Yui: tap to talk, tap when done, tap while she speaks to interrupt. No time limit while he thinks.
- Captions: Japanese with kanji, furigana over every kanji word, romaji underneath. Always on.
- Sidebar help in English, as deep as he likes, with Yui's question kept waiting.
- A correction on screen for every mistake in chat mode, logged for scoring.
- One continuous thread split into sessions; goodbye closes a session.
- A one-line session wrap-up.
- Profile: talk minutes, a 14-day chart, the level score with its breakdown, and sessions with transcripts.
- Memory: facts he gives, and topics from chats.

Out of v0 (see Backlog): an animated face, a home screen, onboarding or instruction screens and tips, a separate coach voice, buttons for replay, slower or English, a Stuck button, voice settings, end-of-session synopsis, an activity grid, a captions toggle, scenario or lesson flows.

## Conversation behavior

Yui has three modes. The app tracks the mode from her structured replies and enforces the rules that must never depend on the model.

| Mode | Enters when | Language | Corrections | Leaves when |
| --- | --- | --- | --- | --- |
| Chat (default) | Session start; any normal reply | Japanese only, at his level | Every mistake, shown on screen | He asks about the language; he says goodbye |
| Sidebar | He asks what something means, about a kanji, how to use something, how to say something, why, or about a fix, in any language | Short plain English, with Japanese examples as separate spoken parts | None. The sidebar is a safe place for any question | He signals he's done (ok, got it, わかった) or answers her waiting question in Japanese |
| End | The app detects a goodbye (またね, じゃあね, bye, おやすみ and similar) outside a sidebar | Short warm goodbye | None | Next thing he says starts a new session |

Chat mode:

- Yui leads. She asks one easy question about his life per turn and builds on his answers. She has her own life (bakery in Meguro, cat Mochi) and mentions it now and then.
- N5 words and grammar plus words he has shown he knows; polite です/ます; one or two short sentences.
- If he says something in English (a statement, not a question about Japanese), she gives him the Japanese for it first, then replies.
- もういちど repeats her line; ゆっくり repeats it slower; わかりません makes her rephrase more simply. No buttons for any of these.
- "How do I say X?" is a question about Japanese, so it always opens a sidebar, detected by the app as well as the prompt.
- There is no instruction screen and no onboarding tips in v0.

Sidebar:

- Curiosity is the point. No depth limit, follow-ups on her own explanations welcome.
- Answers stay short: one or two sentences, at most one example. He can ask for more.
- Japanese never appears inside an English sentence, so the English voice never reads Japanese.
- Her waiting chat question stays visible with furigana and romaji, plus any recent fixes.
- When he returns, she invites him to use what he just learned in answering her question.

Fixes:

- Every mistake in chat mode is shown as a compact card: what he said, struck through, the correct version with furigana, and a reason under 12 words. Several fixes share one card.
- A fix must quote exactly what he said and differ from the correction; the app drops any that don't, and romaji spelling variants never count.
- Fixes are shown, not spoken. Yui then replies normally, using the correct form.
- Every fix is logged and feeds scoring. Past fixes go into her prompt so she sets up chances to use the correct form.

Memory:

- Whatever he says about himself is taken as true. After each session, grading saves short notes: facts about him and what they talked about.
- She uses them to follow up naturally next time ("did you go for Indian food?").

Thread and sessions:

- One running conversation with Yui, like a messaging thread. Opening the app continues it; she greets him back knowing how long it's been and what they last talked about.
- A session ends on goodbye, or after about 30 minutes of inactivity. Ending triggers grading in the background.
- Leaving for the profile pauses her voice; the conversation is untouched. The mic stops listening while he's away.

## Screens

There are two screens and two sub-views. Opening the app lands on Yui; the only prompt is the microphone permission on first use.

| Screen | What it shows | States |
| --- | --- | --- |
| Conversation (landing) | Yui's face area, her current line as captions, his last line, a Transcript button, a You button | Yui talking; his turn; listening; thinking; sidebar (waiting question pinned); fix card above her reply; session done line |
| Transcript | The whole thread, with a date divider per session, fixes inline | Scrolled to the latest line |
| Profile (You) | Minutes this week and today, streak; a 14-day bar chart; level score with breakdown; session list | Empty before the first session; level empty until the first graded session |
| Session detail | Fixes, words he asked about, full transcript of that session | Unfinished sessions marked |

Edge states (no mic permission, offline, Yui fails to reply, very long silence) get a design pass after v0.

## Level scoring

The score is "N5 · X% of the way to N4", updated after each session. It borrows from spaced-repetition maturity and mastery tracking, so one good session can't move it much.

Mastery rule: a word or grammar pattern counts as mastered after he uses it correctly on 3 different days. A wrong use removes one day. Items with 1 or 2 days show as learning.

The score combines coverage and quality:

```
score = (0.55 × mastered_words / 1500 + 0.45 × mastered_patterns / 200)
        × (0.7 + 0.3 × (accuracy + understanding) / 2)
```

- 1,500 words and 200 grammar patterns are rough cumulative targets through N4. JLPT publishes no official lists, so these are approximate.
- Accuracy: his Japanese replies with no fix, divided by all his Japanese replies, averaged over the last 5 sessions. Counted in code.
- Understanding: share of Yui's chat words he knew, averaged over the last 5 sessions.

The profile shows each part as a bar with a plain explanation, so he can see why the number is what it is.

In the prototype, words and patterns used correctly come from a grading pass by the model, and understanding is a model estimate. In the real app, understanding is counted in code: a Japanese tokenizer splits Yui's lines into words and checks them against his known set (used correctly: known; asked about: unknown; heard and answered sensibly: probably known; otherwise unconfirmed).

## Data model

Everything below belongs to one learner. Names are suggestions for the build.

| Entity | Key fields | Notes |
| --- | --- | --- |
| Session | id, started_at, last_activity_at, active_seconds, status (open, done), topic, graded_at | Active time counts gaps between turns, capped at 90 seconds each |
| Turn | session_id, at, speaker (learner, yui), mode (chat, sidebar, end), text segments with readings, romaji, English parts, audio_ref | Yui's Japanese is stored as segments, each with an optional reading for furigana |
| Fix | turn_id, wrong, right (segments), reason, at | Chat mode only |
| Asked item | word or kanji, session_id, at | From sidebar questions |
| Item evidence | item (word or grammar pattern), kind, correct_days[], wrong_count | Drives the mastery rule |
| Session grade | session_id, accuracy, understanding, japanese_attempts, fixes_count, asked_count | One per graded session |
| Memory | facts[] (from him), topics[] (from chats) | Not shown or editable in v0. Memory controls are backlog |
| Learner state | level band, target words for next session | Recomputed after each session |

## Technical decisions

Decided:

- **Platform:** a PWA (installable web app) for Chrome on his Android phone and Chrome or Safari on his MacBook, with one codebase and one deploy. Sessions and transcripts live on the server, so the thread continues across devices. No app store.
- **Voice pipeline:** speech-to-text, then Claude, then text-to-speech, rather than a single speech-to-speech model. This keeps the raw transcript for fixes and grading, and lets captions, furigana and the English voice be controlled separately.
- **Turn-taking:** tap to talk, tap when done, tap to interrupt. Automatic end-of-turn detection comes later, once it can tell a thinking pause from a finished sentence.
- **Two voices:** a Japanese voice for every Japanese part and an English voice for sidebar English. Each reply is a list of parts tagged with language.
- **Structured replies:** Yui returns JSON: mode, parts, fixes, asked items, whether his message was a Japanese attempt. The app, not the model, decides goodbyes, routes "how do I say" to the sidebar, blocks corrections in sidebars, filters false fixes, and counts accuracy.
- **Prompts live on the server** as a system prompt, with learner state injected each turn (level, known items, recent fixes, asked items, targets, facts, topics). Messages from him can't change her rules.
- **Japanese text:** readings for furigana and word splitting come from a Japanese tokenizer such as Sudachi or MeCab, not from the model. The prototype used model readings and occasionally got one wrong.
- **Grading job:** runs server-side when a session closes (goodbye or inactivity). It updates item evidence, the session grade, topics and next targets.
- **Model choice:** a fast model for conversation turns, a stronger one for grading.

To decide in Claude Code:

- Speech-to-text and text-to-speech providers with good Japanese, hosting, auth, and storage. Reuse the setup playbook from the date planner project (`docs/playbook.md`).
- Latency budget per turn, aiming for Yui to start speaking about 1.5 seconds after he finishes.

## Success metrics

North star: minutes of Japanese spoken per day. In v0 this is minutes talking with Yui; real-person minutes come later.

After two weeks of use:

- Talked with Yui on at least 10 of 14 days without forcing it.
- Sessions of 10 minutes or more on most days.
- Understanding stays around 95 to 98%; if it drops, Yui is pitched too high.
- Fixes per Japanese reply trending down, and items moving from learning to mastered.

If he keeps coming back but Yui drifts above his level, build the code-based understanding count next. If he stops coming back, the problem is the character or the format, not the syllabus.

## Backlog

Ordered roughly by when it's likely to matter.

| Item | Area | Why |
| --- | --- | --- |
| Latency measurement and reduction | Conversation | Slow replies break the feeling of talking to someone |
| Better definition of a fix | Conversation | Teach spoken Japanese: casual speech isn't a mistake, typing spellings are ignored, style tips aren't fixes |
| Natural-sounding voices, English especially | Conversation | Built-in voices sound robotic; the English sidebar voice is the worst |
| Sidebar questions as a level signal | Scoring | What he asks about (words, grammar, how to say things) shows exactly what he doesn't know yet |
| Code-based understanding count | Scoring | Exact, instead of a model estimate |
| Automatic end-of-turn detection | Conversation | Remove the second tap |
| Inline assist mid-sentence ("how do I say coconut?") | Conversation | Fill a missing word without leaving the chat |
| Session synopsis: what went well, one gap, next time | Wrap-up | Only once the next sessions actually act on it |
| Memory controls: see, add and delete facts and topics | Memory | Fix something Yui remembered wrong, or tell her a new fact |
| Keep made-up answers out of memory ("just practice") | Memory | He sometimes invents answers to keep talking, and Yui repeating them back feels off |
| Progress over time: level, vocabulary, grammar, kanji | Profile | Progress is motivating |
| Fading furigana on kanji he can read | Captions | Builds kanji reading |
| Captions toggle | Captions | Hide romaji or captions as he improves |
| Provisional score until enough sessions | Scoring | Avoid early noise |
| Quick vocabulary check every week or two | Scoring | Confirms items marked unconfirmed |
| Onboarding tips for new users | Onboarding | Only if it expands beyond Advait: what to ask, もういちど, how to say bye |
| Rehearsal for real situations (life admin, work) | Conversation | Practice a call or meeting before it happens |
| Real-person minutes tracking | Metrics | The real north star |
| Daily nudge written by Yui | Engagement | Brings him back |
| Animated face for Yui | Conversation | Connection; test voice-only, then 2D, then realistic |
| Edge state designs | All | No mic, offline, failed replies |

## Open questions

- Native app later? Only if something specific needs it, such as the animated face or lock-screen audio.
- Speech-to-text and text-to-speech providers: which handle a learner's accented, halting Japanese best, and which Japanese voice feels most natural?
- How long a gap closes a session automatically: 30 minutes is the starting guess.
- Does a face earn its cost, and when do we test it?
