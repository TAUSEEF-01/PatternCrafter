# PatternCrafter

## Central Portal

This repository now includes a portal at `portal/` that aggregates the existing apps into a single website with navigation:

Intent & Slot Tester (React TS) → `intent_slot_tester/`

During development, the apps run on fixed ports and the portal embeds them via iframes so functionality remains unchanged. You can also open each app in a new tab from the portal.

### Run locally (Windows PowerShell)

Run everything from the portal with one command:

1. `cd portal`
2. `npm install`

- Build and stage the SPAs under `/apps/ca/`, `/apps/rs/`, `/apps/ist/`
- Start the portal at http://localhost:5172
  This will:

- Build and stage the SPAs under `/apps/ca/` and `/apps/rs/`
- Start the Flask backend on port 5175
- Start the portal at http://localhost:5172
