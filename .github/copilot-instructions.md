# Copilot Instructions for AI Coding Agents

This guide provides essential knowledge for AI agents working in the Chit codebase. Follow these instructions to be immediately productive and maintain project conventions.

## Architecture Overview

-   **Main App:** Svelte 5 project in `/src` (browser-based chat UI for Ollama)
-   **Electron Shell:** `/desktop` wraps the Svelte app for desktop use
-   **Server (Optional):** `/server` is an experimental Python backend, not required for most workflows
-   **Static Assets:** `/public` and `/docs` hold static files and production builds

## Key Workflows

-   **Install dependencies:** `npm install`
-   **Start dev server:** `npm run dev` (Svelte app at http://localhost:4000)
-   **Build production:** `npm run build` (outputs to `/docs`)
-   **Preview build:** `npm run preview`
-   **Electron dev:** From `/desktop`, run `ELECTRON_DEV=1 npm start` after starting Svelte dev server
-   **Electron build:** From `/desktop`, run `npm run build` after building Svelte app

## Code Style & Conventions

-   **Formatting:** 4 spaces, no tabs/semicolons, LF endings, trim trailing whitespace, no final newline
-   **Imports:** ES2022 syntax; group by library, then local
-   **Types:** TypeScript strict mode; prefer explicit types
-   **Naming:**
    -   camelCase for vars/functions
    -   PascalCase for components/classes
    -   kebab-case for Svelte files
    -   camelCase or PascalCase for TS/JS files
-   **Error Handling:** Always handle Promise errors (`.catch`/`try-catch`), provide clear messages
-   **Components:** Svelte in `/src/app`, utilities in `/src/lib`
-   **Comments:** Use JSDoc for functions; keep comments concise and relevant
-   **Code Design:** Prefer modular, reusable functions and components; separate UI from logic; prefer simple over more complex solutions, they should be maintainable and self-documenting

## Project Patterns & Integration

-   **Preset Prompts:** `/src/preset-prompts` contains reusable system prompts for chat sessions
-   **Audio Feedback:** `/src/lib/audio.ts` manages sound effects for UI
-   **Ollama Integration:** Uses [Ollama JS SDK](https://github.com/ollama/ollama-js) for LLM communication
-   **Persistent Storage:** Chat sessions and settings are saved in browser storage
-   **No third-party backend:** All core features run client-side except optional `/server`

## Examples

-   Svelte component: `/src/app/PageContent.svelte`
-   Utility function: `/src/lib/utils.ts`
-   Chat logic: `/src/lib/chatSession/chatSession.ts`
-   Electron entry: `/desktop/main.js`
-   Python server: `/server/backpack/server.py`

## Additional Notes

-   **Linting:** Use Prettier manually (no explicit lint script)
-   **Experimental server:** `/server` is not required for normal use
-   **No PRs:** Project is personal/WIP; contributions are not accepted

---

For questions or unclear conventions, review `/AGENTS.md`, `/README.md`, or ask for clarification.
