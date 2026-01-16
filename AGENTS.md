# Repository Guidelines

## Project Structure & Module Organization
- `src/` holds the TypeScript source; `src/index.ts` is the entry point and feature code lives under `src/modules/` (notably `src/modules/Meet/`).
- `addon/` contains the Zotero extension scaffold (manifest, bootstrap, chrome content, locales, CSS, icons).
- `scripts/` provides build/start/stop helpers; `scripts/zotero-cmd-default.json` is the template for local Zotero paths.
- `tags/` stores command tag templates; `typing/` contains global type declarations; `imgs/` has screenshots and assets.
- `builds/` is generated output and `.xpi` packages; treat it as build artifacts, not source.

## Build, Test, and Development Commands
- `npm install` installs dependencies.
- `npm run build` produces a production build and runs `tsc`; the `.xpi` lands in `builds/`.
- `npm run build-dev` or `npm run build-prod` builds with the desired environment flag.
- `npm run tsc` runs a strict TypeScript type check only.
- `npm run start`, `npm run start-z6`, `npm run start-z7` launch Zotero with a debugger; require `scripts/zotero-cmd.json` pointing to your Zotero binary.
- `npm run stop` closes Zotero; `npm run restart-dev`/`npm run restart-prod` rebuild and restart.
- `npm test` is a placeholder and exits with an error.

## Coding Style & Naming Conventions
- TypeScript with `strict` enabled in `tsconfig.json`.
- Match existing formatting: 2-space indentation, double quotes, and optional semicolons (follow the file you edit).
- Naming: PascalCase for classes and some module files (for example, `OpenAI.ts`), camelCase for functions and variables, and descriptive module names under `src/modules/`.

## Testing Guidelines
- There is no automated test suite; rely on `npm run tsc` for type safety.
- Manual verification: build the `.xpi`, install it in Zotero, and exercise the UI or command tags you changed.

## Commit & Pull Request Guidelines
- Recent history favors short, imperative messages like "Update README.md" or "Add ..."; no strict Conventional Commit pattern.
- Keep commits scoped and descriptive; avoid mixing refactors with feature changes.
- PRs should include a concise summary, steps to verify (commands or manual flow), and screenshots for UI changes; link issues when applicable.

## Local Configuration & Secrets
- Copy `scripts/zotero-cmd-default.json` to `scripts/zotero-cmd.json` and fill in local paths/kill commands.
- API keys are configured inside Zotero; do not commit secrets or user-specific paths.
