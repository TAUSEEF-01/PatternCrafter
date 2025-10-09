# Ranking & Scoring Labeling UI

A React + Vite workspace that emulates Label Studio style labeling flows for the **Ranking & Scoring** family of templates. Reviewers can work through ASR hypotheses, image retrieval, document selection, SERP quality, pairwise tasks, and text-to-image comparisons, then inspect or export their annotations as JSON on a dedicated summary page.

The app ships with a graceful fallback catalogue and can optionally consume the FastAPI backend located in `../backend` for template ingestion and result persistence.

## Frontend quick start

```bash
cd labeling-ui
npm install
npm run dev
```

### Environment variables

- `VITE_API_URL` (optional): base URL of the FastAPI backend. Defaults to `http://127.0.0.1:8000`. When available, the UI will pull `/api/templates` and POST completed labels to `/api/annotations`.

### Available scripts

```bash
npm run dev      # run the Vite development server
npm run build    # production build
npm run lint     # lint with eslint
npm run preview  # preview the production build
```

## Backend (FastAPI + venv)

A lightweight FastAPI service exposes the same template catalogue and receives annotation payloads. Set it up inside a Python virtual environment to keep dependencies isolated:

```bash
cd backend
python -m venv .venv
# Windows PowerShell
.venv\Scripts\Activate.ps1
# macOS/Linux
source .venv/bin/activate

pip install -r requirements.txt
uvicorn backend.app:app --reload
```

The API surface:

| Method | Path              | Description                                     |
|--------|-------------------|-------------------------------------------------|
| GET    | `/api/templates`  | Returns the template catalogue (JSON)          |
| GET    | `/api/annotations`| Lists persisted annotations                    |
| POST   | `/api/annotations`| Upserts annotation payloads from the frontend  |

Point the React app at the backend by exporting `VITE_API_URL` before running `npm run dev`, e.g. on PowerShell:

```powershell
$env:VITE_API_URL="http://127.0.0.1:8000"
npm run dev
```

## Data export

- **Copy JSON**: Copies the current summary to the clipboard.
- **Download JSON**: Downloads a timestamped `.json` file.
- **Sync to backend**: Sends completed templates to the FastAPI endpoint (requires the server to be running).

Use the “Clear all selections” button from the summary page to reset the session and start a new labeling pass.
