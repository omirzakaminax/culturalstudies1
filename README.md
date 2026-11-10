# Cultural Studies – Learning & Exam Platform

A personal study platform for the Cultural Studies course (Weeks 1–10), with a separate Endterm section for Weeks 6–10.

## How to open it

- **Locally:** open `docs/index.html` in any modern browser. Everything works offline, with no installs and no API key. Progress is saved in that browser (`localStorage`).
- **On GitHub Pages:** see *Publish to GitHub* below. You get a public URL such as `https://<your-username>.github.io/cultural-studies-platform/`.
- **Inside Claude (published artifact):** progress also syncs to your Claude account, and an optional AI tutor appears for open answers. These two extras exist only inside Claude; on GitHub Pages the app falls back to browser storage and keyword checking automatically.
- **Rebuild after editing content:** `npm run build` (or `node build.js`, Node 18+). It bundles `src/` into `docs/index.html`. Nothing needs installing.

## Publish to GitHub

1. Create a new **empty** repository on GitHub, e.g. `cultural-studies-platform`. Don't add a README, .gitignore or license, because this folder already has them.
2. Unzip this folder, open a terminal inside it and run:
   ```bash
   git init
   git add .
   git commit -m "Cultural Studies learning platform"
   git branch -M main
   git remote add origin https://github.com/<your-username>/cultural-studies-platform.git
   git push -u origin main
   ```
   No terminal? On the new repo page click **"uploading an existing file"** and drag in the folder's contents (including the `docs` and `src` folders).
3. Turn on the website: repo **Settings → Pages → Build and deployment → Source: "Deploy from a branch" → Branch: `main`, folder: `/docs` → Save**.
4. After about a minute the site is live at `https://<your-username>.github.io/cultural-studies-platform/`.

Every time you change something in `src/`, run `npm run build`, commit and push. Pages updates by itself.

> **Before making the repo public:** the notes paraphrase and summarise your professor's lecture slides. Your original PDFs are **not** included (and `.gitignore` blocks `*.pdf`). If you are unsure whether your course allows sharing lecture-based notes publicly, make the repository **private**. GitHub Pages on private repos needs a paid plan, but you can still open `docs/index.html` locally.

## What is inside

| Section | What it does |
|---|---|
| Dashboard | Level, streak, XP, Endterm readiness, daily challenge, weakest topics, weekly milestones |
| Today's Session | 5-block daily plan (spaced repetition, new material, active recall, practice, mixed quiz). The length can be adjusted from 20 to 120 minutes |
| Course Roadmap | One page per week: quick or detailed notes, must-memorize lists, commonly confused pairs, exam traps, exam-style questions, a mastery test for each topic and each week |
| **Endterm Prep (W6–10)** | Its own dashboard, roadmap and checklist, notes, flashcards and mnemonics, Practice Arena, mock exams, and progress/weakness tracking. These are kept separate from general progress |
| Theory Lab | All notes in Quick and Deep modes, searchable, with filters by week |
| Memory Lab | Spaced-repetition flashcards (both directions), mnemonics, timeline drills, scholar challenges, Feynman explanations, interleaved revision |
| Practice Arena | 11 formats: MCQ, fill-in, short answer, matching, ordering, true/false, Who am I?, find the incorrect statement, compare & contrast, scenarios, Professor's Challenge, plus "My mistakes" |
| Timeline / Encyclopedia / Dictionary | 77 dates, 127 people, 148 terms. Filters, search, and a recall mode that hides answers |
| Exam Simulator | Weekly, cumulative, full 10-week, Endterm, hard-only, memory and custom exams. Each has a countdown, no hints during the exam, auto-grading, explanations and topic analysis afterwards |
| My Progress | Mastery by week, topic and skill, confused pairs, frequently missed questions, achievements, backup/restore |

## Content sources

Each fact is tagged with its source: **Lecture** (your slides), **Seminar** (seminar slides and official instructions, including the Oxford Bibliographies CQ reading), **External** (researched, used where the slides do not cover a topic), or **Study aid** (explanations and memory hooks).

- No Week 10 lecture was provided. Week 10 is built from the official seminar topics and external sources.
- The LMS reading link needs a university login. The uploaded Oxford PDF was used instead.
- The netiquette YouTube video's captions could not be accessed, so the video was not watched. Paste its transcript to have the notes extended.
- No sample exam was provided. The simulator mixes formats rather than copying an exam format it has not seen.

## How the learning systems work

**Spaced repetition (SM-2 style).** New cards go through short learning steps. *Again* brings a card back in about 1 minute. *Hard* brings it back in about 6 minutes. *Good* sets 1 day, then the interval × ease factor. *Easy* sets 4 days, then a longer interval. Forgetting a card lowers its ease factor, so it returns more often. There is a daily limit on new cards (default 25, adjustable).

**Mastery.** Mastery is the average recall strength of every question and flashcard in a scope. Unseen items count as zero. Reading notes never counts. Statuses: Not Started → Learning → Needs Revision → Almost Mastered → Mastered. "Needs Revision" also appears when your accuracy drops below 60%.

**Personalisation.**
- Wrong answers go into a mistakes queue, and any linked flashcard becomes due immediately.
- An item leaves the queue after 2 correct answers in a row.
- Question selection is weighted toward new, failed and long-unseen items.
- When you mix up two people, the pair is recorded and gets its own confusion drill.

**Open answers.** Short answers and Feynman explanations are checked against key-point groups and shown next to a model answer, and you finish with a self-assessment. Inside Claude, an optional **AI tutor** button gives detailed feedback on top of this. Nothing requires an API key.

**Endterm mock.** Every mock includes at least one question from each of the 28 Weeks 6–10 seminar topics.

## Adding content

All content is plain data in `src/`:

- `d1–d3` week notes
- `d4` people
- `d5` timeline and concepts
- `d6` question bank (the correct option is written first; options are shuffled automatically)
- `d7` mnemonics, Feynman prompts, matching sets and extra cards

Flashcards and many questions are generated automatically from this data. Add an entry, run `npm run build`, then commit and push.

## Project structure

```
src/        content data (d1–d7) + app code (a1–a5) + style.css
build.js    bundles src/ into one self-contained page
docs/       built site (index.html) – served by GitHub Pages
```

The app is dependency-free vanilla JavaScript and CSS, with no framework or bundler. Fonts load from Google Fonts, with system fallbacks when offline.
