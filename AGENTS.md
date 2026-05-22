# AGENTS.md

## Paths
- `/src` is a Svelte project
- `/public` contains top level static content for the `/src` Svelte project
- NO other directories are in-bounds.

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

## Media Attachment System
- Media types are defined in `ChatMediaType` enum (`src/lib/chatSession/chatAttachments.ts`): `IMAGE`, `AUDIO`, `VIDEO`, `TEXT`
- Attachments flow: user picks/pastes file → `chatAddPastedMedia()` stores in IndexedDB → rendered as pills in `InputBar__Attachments.svelte` → sent to LLM via `chatUpdateSession()` in `llm.ts`
- `GenericMessage` type (`src/lib/llm/LLMDriver.ts`) carries `images?: string[]` and `audio?: string[]` (base64 with format prefix like `"wav:data"`)
- `OpenAIDriver.ts` maps images to `image_url` and audio to `input_audio` content parts for the OpenAI API
- Timeline rendering: `ChatLogRegular.svelte` dispatches to `AsyncMediaImage`, `ChatAudioAttachment`, or `ChatLogRegular_User` (text) based on media type
- File picker filter and paste handler live in `InputBar__Attachments.svelte` and `InputBar__PasteHandler.svelte` respectively
- `loadFile()` in `src/lib/utils.ts` reads images and audio as `ArrayBuffer`, text files as text

## Task Focus Guidelines
- **Stay on Task:** Only implement the specific features or changes that were explicitly requested
- **No Unsolicited Features:** Do not add additional features, optimizations, or improvements unless they were specifically asked for
- **Ask Before Expanding:** If you think additional changes would be beneficial, ask for permission first before implementing them
- **Scope Clarity:** If the requested task is unclear or could be interpreted multiple ways, ask for clarification rather than making assumptions

_This file is for agentic coding agents. No Cursor or Copilot rules detected._
