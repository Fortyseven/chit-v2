# Chit Desktop (Electron)

This directory contains the Electron wrapper for the Chit Svelte app.

## Development

1. **Start the Svelte dev server** (from the project root):
   ```bash
   npm run dev
   ```
   This runs Vite on http://localhost:5173.

2. **Start Electron in development mode** (from this directory):
   ```bash
   ELECTRON_DEV=1 npm start
   ```
   Electron will load the dev server. Hot reload works for Svelte changes.

## Production / Packaging

1. **Build the Svelte app** (from the project root):
   ```bash
   npm run build
   ```
   This outputs static files to `dist/`.

2. **Build the Electron app** (from this directory):
   ```bash
   npm run build
   ```
   The distributable will be in `desktop/dist/`.

## Notes
- The Electron app loads the Svelte app from the root `dist/` directory in production, or from the dev server in development.
- All Svelte code and assets remain in the root project; Electron is only a wrapper.
