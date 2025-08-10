# AGENTS.md

## Paths
- `/desktop` is an Electron shell that uses the main Svelte project as the renderer
- `/src` is a Svelte project
- `/public` contains top level static content for the `/src` Svelte project

## Build, Lint, and Test
- Install deps: `npm install`
- Dev server: `npm run dev`
- Production build: `npm run build`
- Preview build: `npm run preview`
- Lint: Use Prettier (no explicit lint script)

## Code Style Guidelines
- **Formatting:** 4 spaces, no tabs/semicolons, LF endings, trim trailing whitespace, no final newline
- **Imports:** ES2022 syntax; group by library, then local
- **Types:** TypeScript strict mode; prefer explicit types
- **Naming:** camelCase for vars/functions, PascalCase for components/classes, kebab-case for Svelte, camelCase or PascalCase for TS/JS files
- **Error Handling:** Always handle Promise errors (`.catch`/`try-catch`), provide clear messages
- **Components:** Svelte in `/src/app`, utilities in `/src/lib`
- **Comments:** Use JSDoc for functions; keep comments concise and relevant

_This file is for agentic coding agents. No Cursor or Copilot rules detected._
