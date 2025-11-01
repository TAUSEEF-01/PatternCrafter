# PatternCrafter Portal

A lightweight React + Vite app that serves as the central entry point to the PatternCrafter modules:

- Conversational AI (Vite React TS) at http://localhost:5173
- Ranking & Scoring (Vite React JS) at http://localhost:5174
- Intent & Slot Tester (React TS) served statically by the portal
- Computer Vision (Vite React TS) at http://localhost:5177

You can override these with environment variables:

- `VITE_CONVERSATIONAL_AI_URL`
- `VITE_RANKING_SCORING_URL`
- `VITE_INTENT_SLOT_URL`
- `VITE_COMPUTER_VISION_URL`

## Development (single command)

Run everything from the portal workspace:

```bash
npm install
npm run dev
```

What this does for you:

- Builds the SPAs (`conversational_ai`, `ranking_and_scoring`, `intent_slot_tester`, `computer_vision`) and stages them under `/apps/ca/`, `/apps/rs/`, `/apps/ist/`, `/apps/cv/`
- Boots the portal dev server on http://localhost:5172

Open http://localhost:5172 and use the portal to access every embedded module.
