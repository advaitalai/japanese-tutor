# Decisions log

Why v0 looks the way it does. Each line is a decision Advait made while testing prototypes v0 to v0.9 (Nov 8 to 11, 2026), with the reason. Add new decisions at the bottom.

## Product direction

- **Free conversation first, not life admin flows.** Scripted goals ("order an iced matcha latte") felt like Speak: scaffolded, checkbox progress. Rehearsing real situations is backlog.
- **Connection and career are the motivators.** He isn't motivated by studying. A character worth talking to brings him back; becoming hireable as a bilingual professional is the long-term pull.
- **Customer of one.** Build for Advait. Anything only needed by other users (onboarding tips, instruction screens) is backlog.
- **Descope hard.** Build fast and bug-free over feature-rich. Most help happens by talking to Yui, not through UI.

## Conversation

- **Voice-first, almost no UI.** Long-term the screen is Yui's face, voice and expressions. No replay, slower, English or Stuck buttons: he says もういちど, ゆっくり, わかりません, or asks in English.
- **Sidebar instead of a separate coach.** One character switches to English for language questions. A separate coach voice and persona was cut.
- **Curiosity has no depth limit.** Forcing him back to the conversation after two levels of questions discouraged curiosity. He decides when to go back ("ok", わかった, or answering her question).
- **Sidebar answers stay short.** Long explanations were tiring and pushed captions off screen.
- **"How do I say X?" is a sidebar.** It was being treated as something he wanted to say to Yui. The app now detects it.
- **Correct every mistake.** Being "a red pen" is fine; that's the point of learning. Fixes are shown on screen, not spoken (speaking them was disruptive), and never in sidebars (the sidebar is a safe place to ask anything).
- **No fake fixes.** A fix must quote what he actually said and differ from the correction. Romaji spelling (o/wo) is never a mistake. Teach spoken Japanese, so casual speech and style tips aren't fixes (refining this is backlog).
- **Kanji with furigana and romaji, always.** He wants to learn to recognize kanji while talking. A captions toggle is backlog.
- **Japanese is always spoken by the Japanese voice.** Japanese read by the English voice sounded wrong, so Japanese never goes inside English sentences.
- **Goodbye is detected by the app.** The model sometimes missed またね and didn't end the session.
- **Never auto-end mid-thought.** Long pauses while reading or in a sidebar must not end the session.

## Thread, memory and screens

- **One continuous thread, like a WhatsApp DM.** No new chats or topics. Sessions split the thread and show up in the profile.
- **Opening the app lands on Yui.** No home screen, no onboarding, no instruction screen.
- **Memory stores topics, not claims.** He sometimes makes things up to keep the conversation going ("Indian food with 3 friends"), and Yui repeating those back felt inauthentic. "Just practice" keeps something out of memory.
- **Wrap-up is one line.** "What went well / gaps / next time" was removed because the app didn't actually act on the promise. Synopsis is backlog.
- **One profile page as the dashboard.** Talk minutes and trend, level with breakdown, sessions with transcripts and fixes, and a small "What Yui knows". The GitHub-style activity grid felt unnatural and was cut.
- **Voice settings are hard-coded.**

## Scoring

- **The level needs repeated evidence.** 29% to N4 after one chat was wrong. A word or pattern is mastered only after correct use on 3 different days; a wrong use removes a day. Borrowed from spaced-repetition maturity and mastery tracking rather than invented.
- **Show how the score was built.** Bars for vocabulary, grammar and quality, each with a plain explanation.
- **No provisional label in v0.** Simple update after each session; provisional scoring is backlog.

## Platform

- **PWA.** Android phone plus MacBook, one codebase, no app store. Artifacts inside Claude were fine for prototypes but can't use the mic, run background grading, or keep data across versions.

## Process

- **The playbook is guidance, not law.** It comes from a different app (a WhatsApp bot). Follow it by default, adapt it where Yui differs, and update it as we learn.
- **Screens are designed as an HTML mockup, not in Stitch.** Stitch can't generate screens from cloud sessions (calls are cut after 30 seconds). The mockup renders real furigana and fonts, is clickable on his phone, and its layout carries straight into the PWA.
- **No "What Yui knows" screen in v0.** Cut to keep v0 small. Memory still works underneath (fixed facts, topics from chats, "just practice"). Seeing and editing it is backlog.
