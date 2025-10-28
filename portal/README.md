# PatternCrafter Portal

A lightweight React + Vite app that serves as a central entry point to the three modules:

- Conversational AI (Vite React TS) at http://localhost:5173
- Ranking & Scoring (Vite React JS) at http://localhost:5174
- Intent & Slot Tester (React TS) is bundled and served statically by the portal

You can override these with env vars: VITE_CONVERSATIONAL_AI_URL, VITE_RANKING_SCORING_URL, VITE_INTENT_SLOT_URL.

## Development (single command)

Run everything from the portal only:

1. In `portal/`:
   - `npm install`
   - `npm run dev`

What this does for you:

- Builds the three SPAs (`conversational_ai`, `ranking_and_scoring`, `intent_slot_tester`) and serves them statically under `/apps/ca/`, `/apps/rs/`, `/apps/ist/`
- Boots the portal dev server on http://localhost:5172

Open http://localhost:5172 and use the portal to access all pages.
