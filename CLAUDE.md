# numo-web: conventions

Next.js 16 (App Router, TypeScript, **ESM**) web app for NuMo. Local-only for now. Setup and commands: see `README.md`.

## Workflow

- Everything is in **English**: code, comments, issues, commits, PRs.
- Branches: Conventional Branch, `<type>/<issue-number>-<slug>` (e.g. `feature/12-create-account`, `bugfix/…`).
- Commits: `#<issue-number>: <description>`.
- This repo is public: don't reference other private projects in code, commits or PRs.

## Tooling

- **Yarn 4 only** (Corepack, `packageManager`); never npm, never commit `package-lock.json`.
- Node 26 (`.nvmrc`). Corepack must be installed separately (`npm install -g corepack`).
- Dev server runs on port **3001** (`numo-api` owns 3000).
- Before handing work over: `yarn format:check && yarn lint && yarn typecheck && yarn test:cov && yarn build && yarn test:e2e` must pass (80% coverage).
- Never bypass the pre-commit hook (`--no-verify`).
- Next.js 16 may differ from what you remember: check the docs bundled in `node_modules/next/dist/docs/` before using an API, and heed deprecation notices.

## Architecture (Clean Architecture, by feature)

- `src/app/` holds **routes and layouts only**: thin files that compose feature UI. No business logic, no data fetching details.
- Features live in `src/features/<feature>/` (mirroring `numo-api` modules), with only the layers they need:
  - `domain/`: types and pure business rules (no React, no Next, no fetch).
  - `application/`: use cases / orchestration hooks depending on ports.
  - `infrastructure/`: `numo-api` clients and DTO → domain mapping. The API base URL lives only here.
  - `ui/`: components.
- Dependency rule: `ui`/`infrastructure` → `application` → `domain`.
- `src/shared/` only for code a **second** feature actually needs. No empty folders or abstractions "for later".
- Import across folders with the `@/*` alias (`@/features/accounts/domain/money`).

## UI conventions

- One camelCase folder per component: `ui/topbar/Topbar.tsx` + `Topbar.spec.tsx`.
- `.tsx` files are PascalCase, `.ts` files camelCase.
- State and effects go in a companion `useX.ts` hook, so the component file is JSX only.
- Prefer presentational components (props in, JSX out). Keep `"use client"` at the leaves.

## Clean Code

- Intention-revealing names; small single-purpose functions (~20 lines), ≤ 3 args, no boolean flag args.
- Don't return or pass `null`; use `T | undefined`, empty collections or domain errors.
- Comments only for a non-obvious _why_; no commented-out code.
- Let Prettier/Oxlint decide style.

## Tests

- Vitest (jsdom, globals on) + Testing Library; tests next to the code as `*.spec.ts(x)`.
- Arrange–Act–Assert, one behaviour per test; query by role/label as a user would.
- Domain: pure unit tests. Hooks/use cases: fake clients. Components: Testing Library. User flows: Playwright.
- E2E: Playwright (Chromium), specs next to the route as `*.e2e.ts` (e.g. `src/app/page.e2e.ts`). Browsers: `yarn playwright install chromium`.
  - Import `test`/`expect` from `@/testing/e2eFixtures`, never from `@playwright/test`: its `page` fixture fails the test on any browser console error or uncaught page error.
  - Never call the real `numo-api`: mock requests with `page.route()`, with shared defaults in the fixture. No fixed `waitForTimeout`; rely on auto-waiting assertions.
  - `yarn test:e2e` reuses a running `yarn dev` (or starts one); `CI=true yarn test:e2e` builds and serves the production build.
- Every new function gets a test; every bug fix gets a regression test.
