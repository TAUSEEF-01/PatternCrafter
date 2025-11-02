# Annotation Frontend

A Vite + React + TypeScript + Tailwind app wired to the FastAPI backend.

## Dev

1. Install deps

```powershell
cd "D:\Downloads\DUCSE Documents\MyGithub_Projects\3-2 project\PatternCrafter\apps\annotation_frontend"
npm install
```

2. (Optional) Configure API base (defaults to http://localhost:8000/api/v1)

```powershell
@"
VITE_API_URL=http://localhost:8000/api/v1
"@ | Out-File -Encoding utf8 .env.development
```

3. Run dev server

```powershell
npm run dev
```

Open the URL printed in the console (typically http://localhost:5176).

## Build

```powershell
npm run build
```

Outputs to `dist/`.
