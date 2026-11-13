# numo-web

[![PR Validation](https://github.com/spreadcode-dev/numo-web/actions/workflows/pr-validation.yml/badge.svg)](https://github.com/spreadcode-dev/numo-web/actions/workflows/pr-validation.yml)

NuMo's web app, built with Next.js (App Router, TypeScript, ESM). For now it runs locally only.

## Prerequisites

- [nvm](https://github.com/nvm-sh/nvm) and **Node 26** (pinned in `.nvmrc`)
- **Corepack**, which provides the pinned Yarn version. Node 25+ no longer bundles it, so install it once per Node installation.
- **Yarn 4** via Corepack (pinned in `package.json` → `packageManager`). Don't use npm: there must be no `package-lock.json`.

## Setup

```bash
nvm install && nvm use
npm install -g corepack   # once per Node installation
corepack enable
yarn install --immutable  # also installs the Git pre-commit hook
yarn playwright install chromium  # browser for the e2e tests
```

Check: `node -v` prints `v26.x` and `yarn -v` prints `4.x`. If `yarn -v` prints `1.x`, the wrong Node version is active (run `nvm use`) or a global Yarn 1 (e.g. Homebrew) is earlier on your `PATH`.

## Run

```bash
yarn dev                  # http://localhost:3001 (numo-api uses 3000)
yarn build && yarn start  # production build on http://localhost:3001
```

No environment variables are needed yet (see [`.env.example`](.env.example)).

## Scripts

| Command               | What it does                                                   |
| --------------------- | -------------------------------------------------------------- |
| `yarn dev`            | Dev server with hot reload on port 3001                        |
| `yarn build`          | Production build (`.next/`)                                    |
| `yarn start`          | Serves the production build on port 3001                       |
| `yarn lint`           | Oxlint (type-aware); any warning fails                         |
| `yarn format`         | Formats everything with Prettier                               |
| `yarn format:check`   | Fails if any file isn't Prettier-formatted                     |
| `yarn typecheck`      | Generates Next.js route types, then `tsc --noEmit`             |
| `yarn test`           | Unit tests (Vitest + Testing Library, jsdom)                   |
| `yarn test:watch`     | Unit tests in watch mode                                       |
| `yarn test:cov`       | Unit tests with coverage (`coverage/`), 80% minimum per metric |
| `yarn test:e2e`       | End-to-end tests (Playwright, Chromium)                        |
| `yarn test:e2e:ui`    | End-to-end tests in Playwright's UI mode                       |
| `yarn test:e2e:debug` | End-to-end tests with the Playwright inspector                 |

Before opening a PR: `yarn format:check && yarn lint && yarn typecheck && yarn test:cov && yarn build && yarn test:e2e` (the same gate CI runs, see [Continuous integration](#continuous-integration)).

The coverage gate (80% of lines, branches, functions and statements) is set in [`vitest.config.ts`](vitest.config.ts), so it fails the same way locally and in CI. Coverage is measured over all of `src/`, except Next.js wiring (`layout.tsx`), specs and test helpers.

## End-to-end tests

[Playwright](https://playwright.dev/) specs live next to the route they test as `*.e2e.ts` (Vitest only runs `*.spec.ts(x)`, so the suites never overlap).

```bash
yarn test:e2e          # reuses a running `yarn dev` on :3001, or starts one
CI=true yarn test:e2e  # builds and serves the production build, as CI will
```

- Any browser console error or uncaught page error fails the test (see [`src/testing/e2eFixtures.ts`](src/testing/e2eFixtures.ts)).
- The tests never need a running `numo-api`: mock its calls with `page.route()`.
- On failure, open the HTML report with `yarn playwright show-report` (`playwright-report/`; traces in `test-results/`).

## Continuous integration

Every pull request targeting `main` (or `develop`) runs the **PR Validation** workflow ([`.github/workflows/pr-validation.yml`](.github/workflows/pr-validation.yml)). It has two jobs that run in parallel on the Node version from `.nvmrc` and the Yarn version from `packageManager` (shared setup in [`.github/actions/setup-yarn`](.github/actions/setup-yarn/action.yml)):

- **`node-ci`**: `yarn install --immutable` → `yarn format:check` → `yarn lint` → `yarn typecheck` → `yarn test:cov` (80% coverage gate) → `yarn build`.
- **`e2e-tests`**: installs Chromium (cached by Playwright version), then `CI=true yarn test:e2e` against the production build.

Run the same gate locally before opening a PR:

```bash
yarn format:check && yarn lint && yarn typecheck && yarn test:cov && yarn build && CI=true yarn test:e2e
```

Each run's **Artifacts** (Actions → run) hold the HTML coverage report (`coverage-report`, also when a test or the coverage gate fails) and, when the e2e tests fail, the Playwright report (`playwright-report`; open it with `yarn playwright show-report <unzipped folder>`).

The workflow uses a read-only `GITHUB_TOKEN`, pins third-party actions to commit SHAs and cancels outdated runs on the same branch. It needs no secrets: the e2e tests mock every API call.

### Branch protection

`main` requires the `node-ci` and `e2e-tests` checks to pass before a PR can be merged, and the rule applies to admins too (no bypass). GitHub only offers a check as required after it has run once, so a repository admin sets it once, after the first workflow run:

```bash
gh api -X PUT repos/spreadcode-dev/numo-web/branches/main/protection --input - <<'JSON'
{
  "required_status_checks": { "strict": true, "contexts": ["node-ci", "e2e-tests"] },
  "enforce_admins": true,
  "required_pull_request_reviews": null,
  "restrictions": null
}
JSON
```

Check it with `gh api repos/spreadcode-dev/numo-web/branches/main/protection/required_status_checks`.

## Pre-commit hook

`yarn install` installs a [Husky](https://typicode.github.io/husky/) `pre-commit` hook that runs [lint-staged](https://github.com/lint-staged/lint-staged) on the **staged** files only:

- `*.ts` / `*.tsx`: `oxlint --fix`, then `prettier --write`. A lint error that can't be auto-fixed blocks the commit.
- `*.json`, `*.md`, `*.yml`, `*.yaml`, `*.css`: `prettier --write`.

Fixes are added to the commit automatically. Don't skip the hook with `--no-verify`; fix the error instead.

## Project structure and conventions

See [`CLAUDE.md`](CLAUDE.md): Clean Architecture by feature (`src/app/` for thin routes, `src/features/<feature>/` for the code), UI and test conventions.
