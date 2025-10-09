# Conversational AI Labeling Frontend

This React application delivers a Label Studio–inspired experience for four conversational AI tasks:

- Coreference resolution & entity linking
- Intent classification & slot filling
- Response generation
- Response selection

By default, the app uses in-browser mock data (no backend required). If you prefer, you can still point it to the FastAPI service located in `../backend`.

## Prerequisites

- Node.js ≥ 20.19 (Vite 7 requires 20.19+ or 22.12+)
- npm ≥ 10.x

## Environment variables

Create a `.env` file at the project root to override the API base URL if needed:

```bash
VITE_API_BASE_URL=http://localhost:8000
```

Without this variable the app runs in mock mode and no HTTP requests are made.

## Install dependencies

```bash
npm install
```

You may see an engine warning if your Node.js version is slightly behind the recommended version. Upgrade Node.js to silence the warning.

## Available scripts

```bash
# Start the dev server
npm run dev

# Run the type checker and production build
npm run build

# Preview the production build
npm run preview

# Lint source files
npm run lint
```

## Workflow

1. (Optional) Start the FastAPI backend (see `../backend/README.md`). Skip this step to use the built-in mock data.
2. Run `npm run dev` and open the URL printed in the console.
3. Choose a template to open its workspace, label the sample conversation, and submit.
4. Navigate to the “Annotation Results” page to inspect the stored JSON payloads (stored locally in `localStorage` when using mock mode) and download them as a `.json` file if you need to share or archive your work.
