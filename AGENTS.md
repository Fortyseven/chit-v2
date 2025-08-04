# AGENTS.md

## Build, Lint, and Test

- **Install dependencies:**
  `npm install`
- **Start dev server:**
  `npm run dev`
- **Build for production:**
  `npm run build`
- **Preview production build:**
  `npm run preview`
- **Linting:**
  _No explicit lint script; use Prettier for formatting._
- **Run a single test:**
  _No test scripts or test files detected. For Python (server/backpack), run individual files with:_
  `python server/backpack/<file>.py`

## Code Style Guidelines

- **Formatting:**
  - Use 4 spaces for indentation, no tabs (`.editorconfig`, `.prettierrc`)
  - No semicolons (`.prettierrc`)
  - End of line: LF
  - Trim trailing whitespace
  - No final newline
- **Imports:**
  - Use ES2022 module syntax (`import ... from ...`)
  - Group imports by library, then local files
- **Types:**
  - TypeScript: strict mode enabled (`tsconfig.json`)
  - Prefer explicit types for function parameters and return values
- **Naming Conventions:**
  - Use camelCase for variables and functions
  - Use PascalCase for components and classes
  - Filenames: kebab-case for Svelte, camelCase or PascalCase for TS/JS
- **Error Handling:**
  - Always handle errors in Promises (use `.catch` or `try/catch`)
  - Provide clear error messages
- **Components:**
  - Svelte components in `/src/app`
  - Utility logic in `/src/lib`
- **Comments:**
  - Use JSDoc for function documentation
  - Prefer concise, relevant comments

---

Let me know if you want to add more details or custom rules!
