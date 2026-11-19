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
- **No "What Yui knows" screen in v0.** Cut to keep v0 small. Memory still works underneath. Seeing and editing it is backlog.
- **Memory takes what he says as true.** Telling topics from claims, and "just practice", were cut from v0 as unneeded complexity. Both are backlog if made-up answers start coming back.

## Sessions

- **A session is one day (4am to 4am, Tokyo time).** A PWA can't reliably tell the server it was closed, so nothing depends on a close event. A 30-minute gap rule was tried first; one session per day is simpler and matches minutes per day, the chart and the mastery rule. Goodbye grades the day so far; coming back the same day continues it. No timers, no "unfinished" marker.
- **One session summary everywhere: "12 min · 4 used well · 3 fixes".** North star first, then progress, then fixes. "Used well" counts words and grammar points used correctly on a new day; "+4 words" was unclear about whether it meant heard, mastered or mistakes. The level is not shown per session because it barely moves in one session and "+0%" would demotivate.
- **No interrupting Yui in v0.** Her replies are short at N5. The mic is off while she speaks. Interrupting is backlog.
- **No separate test version for one user.** Tests before deploy, version in logs, one-step rollback and daily backups instead. A test version is backlog.
- **Mastery: a mixed day counts as wrong, and 3 days is a setting.** The spacing and retrieval ideas are well researched; the number 3 is not.

## Learning model

- **Items have three kinds: word, grammar point, set.** "Pattern" and "skill set" were used loosely before; these are the only terms now. Glossary is in the spec.
- **N5 starts as known, not mastered.** He passed N5, so he can follow it, but mastery needs his own correct use. Known drives understanding; mastered drives the level.
- **Daily slots: up to 2 repair, up to 3 review, 2 new.** About 7 targets fit a 10-minute session (about 20 of his turns, 2 or 3 chances each). Reviews come before new, and new stops when understanding drops below 95%.
- **Understanding is counted on words, in code.** The research on following a text (95 to 98% coverage) is about words. Grammar is a rule on Yui's lines instead: at most one unlearned point per line.
- **Memory items outside the syllabus become his own items.** A fixed or asked-about word like 解約 is tracked like any other item.
- **"live" in the stories is renamed "on device".** It read as live transcription. Live text while speaking is backlog.
- **Preview copy of the app stays in the backlog for v0.** One live app, tests and P0 runs before each deploy.

## Build setup

- **Sign-in is Cloudflare Access with Google, one account.** The app has a public address, so it needs a lock. Access needs no sign-in code; Tailscale (VPN always on) and built-in login (a day of security code) were the alternatives.
- **Google for speech both ways, no bake-off.** One vendor, no extra keys (the VM's service account). Judge it from real chats in week one using the kept clips; switch if it hides his mistakes.
- **Google Cloud setup runs as one script in Cloud Shell.** Advait creates the billing account (Japan) himself; everything else is scripted. Claude never holds owner credentials; after setup it only needs the read-only log key.
- **Keep S32, errors in plain words.** The date planner showed raw JSON for 1.5 days when a key expired.
