@AGENTS.md

# Project: language-tutor

A speaking-practice tutor for language learners. It started as a single-language
(Korean) app, built by hand, and is now being generalized into a multi-language
app. The Korean-only code currently in `app/api/*/route.ts` and `app/page.tsx`
is the starting point for that generalization — not a mistake to work around.

## Context

- **Purpose**: demo/portfolio project for a class presentation. Deadline: next week.
- **Priority**: simplicity and clarity over abstraction. It should look designed
  and demonstrate the product idea — avoid over-engineering (no speculative
  config layers, no infrastructure beyond what the demo needs).
- **User's background**: no formal programming background, but built the
  original app by hand and can judge whether code is correct. Explain changes
  assuming they can read code, not that they need CS fundamentals explained.

## Working style

Explain every change and wait for explicit confirmation before applying it —
every session, not just the first. Show the specific edit (diff or full new
content), not just a description of it.

## Planned feature roadmap (in order)

1. **Multi-language support** — English, Chinese, Vietnamese, Korean.
   - Interface language stays English regardless of which language is being practiced.
   - Four separate, hand-written system prompts (one per language), not one
     shared template — each language has distinct teaching concerns (e.g.
     Korean honorifics/particles, Chinese tones, Vietnamese tones/classifiers).
   - Language selection is a dropdown shown before the conversation starts.
     No default — the user must choose.
   - Once a conversation begins, the dropdown locks.
   - A "Change language" button returns to the dropdown. If a conversation is
     in progress, it first confirms ("Start over in a new language?") before
     clearing state, to avoid accidental loss.
   - Users can switch freely between conversations.

2. **Supabase** database to persist conversations and corrections.

3. **Anonymous user identity** — a UUID generated and stored in `localStorage`,
   no login/auth. Used to group a user's own mistakes across sessions.

4. **Analytics page** — visualizes mistake patterns, both per-user and
   aggregate across all users.

## Data notes

- Corrections must be stored with a grammar-category tag so aggregate queries
  are possible (e.g. "top grammar mistakes for Chinese natives"). The specific
  category taxonomy is not decided yet — decide it when building the database
  schema (feature 2), not before.
