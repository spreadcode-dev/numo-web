# numo-web

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
```

Check: `node -v` prints `v26.x` and `yarn -v` prints `4.x`. If `yarn -v` prints `1.x`, the wrong Node version is active (run `nvm use`) or a global Yarn 1 (e.g. Homebrew) is earlier on your `PATH`.

## Run

```bash
yarn dev                  # http://localhost:3001 (numo-api uses 3000)
yarn build && yarn start  # production build on http://localhost:3001
```

No environment variables are needed yet (see [`.env.example`](.env.example)).

## Scripts

| Command             | What it does                                                   |
| ------------------- | -------------------------------------------------------------- |
| `yarn dev`          | Dev server with hot reload on port 3001                        |
| `yarn build`        | Production build (`.next/`)                                    |
| `yarn start`        | Serves the production build on port 3001                       |
| `yarn lint`         | Oxlint (type-aware); any warning fails                         |
| `yarn format`       | Formats everything with Prettier                               |
| `yarn format:check` | Fails if any file isn't Prettier-formatted                     |
| `yarn typecheck`    | Generates Next.js route types, then `tsc --noEmit`             |
| `yarn test`         | Unit tests (Vitest + Testing Library, jsdom)                   |
| `yarn test:watch`   | Unit tests in watch mode                                       |
| `yarn test:cov`     | Unit tests with coverage (`coverage/`), 80% minimum per metric |

Before opening a PR: `yarn format:check && yarn lint && yarn typecheck && yarn test:cov && yarn build`.

## Pre-commit hook

`yarn install` installs a [Husky](https://typicode.github.io/husky/) `pre-commit` hook that runs [lint-staged](https://github.com/lint-staged/lint-staged) on the **staged** files only:

- `*.ts` / `*.tsx`: `oxlint --fix`, then `prettier --write`. A lint error that can't be auto-fixed blocks the commit.
- `*.json`, `*.md`, `*.yml`, `*.yaml`, `*.css`: `prettier --write`.

Fixes are added to the commit automatically. Don't skip the hook with `--no-verify`; fix the error instead.

## Project structure and conventions

See [`CLAUDE.md`](CLAUDE.md): Clean Architecture by feature (`src/app/` for thin routes, `src/features/<feature>/` for the code), UI and test conventions.
