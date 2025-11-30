# Repository Improvement Suggestions

## 1. ~~Add a default CI workflow for lint, TypeScript, and Rust checks~~ ✅ COMPLETED

Added `.github/workflows/ci.yml` with 5 jobs:
- `lint` - runs `bun run check` (Biome)
- `typecheck` - runs `bun run typecheck`
- `test` - runs `bun run test` (Vitest)
- `build` - runs `bun run build` (Vite)
- `rust` - runs `cargo test` with Ubuntu WebKit dependencies

Triggers on push to main and pull requests.

## 2. ~~Provide an example frontend testing stack~~ ✅ COMPLETED

Added complete testing setup:
- **Dependencies:** `vitest`, `jsdom`, `@testing-library/react`, `@testing-library/jest-dom`, `@testing-library/user-event`, `@vitest/ui`
- **Config files:** `vitest.config.ts`, `vitest.setup.ts`
- **Example tests:** `src/app.test.tsx` with 5 tests demonstrating Tauri IPC mocking
- **Scripts:** `test`, `test:watch`, `test:ui`, `typecheck`
- **Documentation:** Updated README.md with Testing section, created CONTRIBUTING.md

## 3. Tighten the default capability manifest (SKIPPED)

User chose to skip this suggestion.

## 4. Make `scripts/setup.ts` automation-friendly and validate updater placeholders (SKIPPED)

User chose to skip this suggestion.

## 5. ~~Manage child processes in `scripts/start-dev.ts`~~ ✅ COMPLETED

Updated `scripts/start-dev.ts` to:
- Track spawned child processes in an array
- Add `SIGINT` and `SIGTERM` signal handlers
- Kill all child processes on exit for clean shutdown
