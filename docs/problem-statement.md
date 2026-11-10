# Japanese Speaking Companion: Problem Statement

Nov 8, 2026 · Advait

> Written before prototyping. Where it disagrees with `spec.md`, the spec wins. In particular: v0 starts with free conversation rather than life admin, has no hint or replay buttons, no listen mode, and no tap-any-word lookups (sidebars cover that).

## Customer

One customer: Advait. If it works for him, a product for others is a later and optional question.

- Has lived in Tokyo since June 2025, works in English all day, and plans to stay long term.
- JLPT N5 certified. Can produce survival lines like メニューの中で一番人気は何ですか or 大丈夫です to a coworker, and little beyond that.
- Real interactions end in his broken Japanese meeting the staff's broken English.
- Uses Translate for menus because it is faster than decoding the katakana and kanji.
- Not intrinsically motivated by language learning. Two things drive him: connecting with people, and becoming hireable in Tokyo as a bilingual English-Japanese professional.
- Time: 10 minutes a day by default, up to 30 if it is genuinely engaging.

## Pain points

The core loop is broken: no speaking reps means he can't produce Japanese in real time, so he avoids speaking, so he gets no reps.

1. **No reps.** Work is in English. Outside work, Japanese moments are rare and short, so speaking never becomes comfortable.
2. **Avoidance is cheaper than trying.** Translate, pointing or English gets the job done faster. Every avoided exchange is a lost rep.
3. **No reason to show up.** Drills and admin role-plays feel like chores. Without a pull, he opens apps irregularly and progress stalls.
4. **Completion is not learning.** Checkbox missions like "say the food was delicious" get ticked, but he doesn't feel more able to speak.
5. **Nobody holds his level.** Every tutor has to be told where he stands, every session, and still gets it wrong.
6. **Kanji blocks reading.** Menus, forms and mail go straight to Translate.
7. **A career ceiling.** Without working Japanese, his Tokyo job options shrink to English-speaking roles. Many roles here ask for business-level Japanese, often stated as N2 or above.

## Why existing options fail

Each option solves one piece well and misses the daily pull to talk at his exact level.

| Option | What works | Why it fails for Advait |
| --- | --- | --- |
| Speak and similar AI speaking apps | Real speaking practice, good scenarios including life admin | Too scaffolded: a few lines each side, checkbox goals. Finishing feels like progress on paper. Doesn't pull him back often enough to improve. |
| Preply and online tutors | A real person, live speaking | Don't know where he stands, so he re-explains every session. Unstructured. One or two sessions a week at most. |
| Classes and textbooks (Genki, Minna no Nihongo) | Excellent grammar sequencing | Mostly one-way and rote. Not personalized. Little speaking time. |
| General AI chat (ChatGPT, Claude voice) | Unlimited conversation | Forgets his level, drifts above it, has no curriculum. He has to design every session himself. |
| Living in Tokyo | Constant exposure | An English workplace plus Translate means avoidance always wins. |

## Core insight

Children learn fast because three things hold at once: they talk with people they care about, what they hear sits near their level, and they need to say things. They look words up when they need them, not before.

Today's options supply one of these at most. Apps control level but offer no relationship. Tutors offer a person but no memory of his level. Nothing gives him a daily reason to talk.

AI can supply all three every day, at almost no cost per rep.

## What we're building

A Japanese conversation companion: an AI character with a lasting personality and memory, whom Advait talks with daily about his actual life, in Japanese pitched at exactly his level.

Underneath, it quietly runs a Genki-grade syllabus: a grammar graph, a vocabulary and kanji tracker, and spaced review. Structure under the hood, freedom on the surface.

Content runs on three tracks over one syllabus: life admin (a redelivery call, the ward office), social connection, and work Japanese (meetings, business keigo, job interviews). Connection keeps him coming back; work Japanese is where the career payoff sits.

## Design principles

1. **Open conversation, no checkboxes.** The system steers topics so target words and patterns come up naturally. Success is the conversation itself.
2. **His level plus one step, enforced by code.** Every line the character says is checked against his known vocabulary before he hears it.
3. **A character worth talking to.** It has its own life, opinions and running stories. It remembers what he said last week and follows up.
4. **A bridge, not a destination.** The character pushes him toward real people: what to say to a coworker tomorrow, and how it went.
5. **Work Japanese from his own field.** Career scenarios use his real work: a self-introduction, explaining a pricing decision in a meeting, a job interview.

## Success metrics

North star: minutes of live Japanese spoken with real people per day. v0 measures minutes with Yui first.

Leading indicators:

- Days per week he opens it without a reminder.
- Session length drifting from 10 toward 30 minutes.
- Words and patterns moving from used once to mastered.
- Fewer switches to English or Translate in real interactions, self-reported.

Proposed milestone, to confirm: order and ask questions at a restaurant, and handle one admin call, fully in Japanese within 3 months.

Career milestone, to confirm: hold a 15-minute job interview in Japanese about his own work, and reach the level Tokyo employers mean by business Japanese.

## Open hypotheses and risks

- **Does a face earn its cost?** Real-time animated avatars add cost, latency and uncanny-valley risk. Test in steps: voice only, then a simple expressive 2D character, then realistic.
- **Does AI connection transfer to real people, or replace them?** If AI minutes rise and real-person minutes don't, the bridge isn't working.
- **Can open conversation still cover the syllabus?** Free talk tends to avoid hard patterns. Measure target items produced per session.
- **Is open conversation too hard at N5?** Scaffolding should be invisible but present: Yui leads, rephrases, and sidebars are always available.
- **The two goals pull on register.** Friendly chat drifts casual, while work needs polite form and keigo. Default to です/ます, and layer keigo in from about N4.
- **The career goal is a long road.** Early wins come from connection and life admin, so motivation doesn't depend on a distant target.
- **Latency.** Replies slower than about 1.5 seconds break the feeling of talking to someone.
