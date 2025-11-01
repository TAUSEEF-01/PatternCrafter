# PatternCrafter

A monorepo containing AI pattern design and annotation tools, organized as a multi-app portal.

## Project Structure

```
PatternCrafter/
|- apps/
|  |- portal/                # Main portal application
|  |- conversational_ai/     # Conversational AI annotation tool
|  |- ranking_and_scoring/   # Ranking & scoring interface
|  |- intent_slot_tester/    # Intent & slot testing tool
|  `- computer_vision/       # Vision annotation workspace
|- package.json               # Root workspace configuration
`- README.md
```

## Quick Start

### Install Dependencies

From the root directory:

```bash
npm install
```

This installs dependencies for every workspace under `apps/`.

### Development

**Run the portal (recommended):**

```bash
npm run dev
```

This builds and embeds all apps in the portal at http://localhost:5172.

**Run individual apps:**

```bash
npm run dev:portal # Portal only
npm run dev:ca     # Conversational AI
npm run dev:rs     # Ranking & Scoring
npm run dev:ist    # Intent Slot Tester
npm run dev:cv     # Computer Vision
```

### Build for Production

**Build all apps:**

```bash
npm run build
```

**Build individual apps:**

```bash
npm run build:portal
npm run build:ca
npm run build:rs
npm run build:ist
npm run build:cv
```

## Workspaces

This is an npm workspaces monorepo. Each app in `apps/` is an independent workspace with its own dependencies and configuration.

## Features

- **Unified Portal** - Single entry point with navigation across all tools
- **Computer Vision Tasks** - Tailored workspace for image-based annotation
- **Dark/Light Theme Toggle** - All apps respect the shared theme parameter
- **Type Safety** - TypeScript throughout (except the legacy ranking_and_scoring app)

## Tech Stack

- **React 19** - UI framework
- **Vite 7** - Build tool
- **TypeScript** - Primary language
- **npm Workspaces** - Monorepo management
