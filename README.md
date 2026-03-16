# Task Tracker — Web App

Plain TypeScript + HTML + CSS, bundled with Vite. No React. Desktop-first UX with sidebar navigation.

## Setup

```bash
npm install
```

## Develop

```bash
npm run dev
```

Runs at http://localhost:5173. API requests to `/api/*` are proxied to the backend (default `http://localhost:3000`). Set `VITE_API_URL` to point at another API (e.g. `https://api.example.com`) if not using the proxy.

## Build

```bash
npm run build
```

Output is in `dist/`. Serve with any static host. For production, set `VITE_API_URL` to your API base URL (e.g. `https://api.yourdomain.com`).

## Features

- **Login** — Email + password; JWT stored in `localStorage`.
- **Tasks** — List with label filter, drag-to-reorder, add task, archive (with undo toast).
- **Task detail** — Inline edit title, description, status, label, due date; archive button.
- **Archive** — List archived tasks; restore to move back to main list.
- **Settings** — About (version, APK link), sign out.

Design follows the same tokens as the mobile app (dark theme, accent violet). Navigation is a left sidebar for desktop.
