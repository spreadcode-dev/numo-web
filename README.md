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

## Branch flow (GitFlow)

- **`develop`** is the default and integration branch. Work branches start from it and go back into it through a PR: `<type>/<issue-number>-<slug>`, lowercase and hyphenated, e.g. `feature/12-create-account`.
- **`main`** only receives `release/<version>` branches (cut from `develop`) and `hotfix/<issue-number>-<slug>` branches (cut from `main`). After a release or hotfix, `main` is merged back into `develop`.
- Every commit is titled `#<issue-number>: <description>`, and a PR has **exactly one commit**. Only `release/*` → `main` and `main` → `develop` may carry several.
- Nobody pushes to `main` or `develop` directly: every change goes through a PR whose checks pass (see [Branch protection](#branch-protection)).

## Continuous integration

Every pull request targeting `develop` or `main` runs the **PR Validation** workflow ([`.github/workflows/pr-validation.yml`](.github/workflows/pr-validation.yml)). Its jobs run in parallel; the Node ones use the Node version from `.nvmrc` and the Yarn version from `packageManager` (shared setup in [`.github/actions/setup-yarn`](.github/actions/setup-yarn/action.yml)):

- **`node-ci`**: `yarn install --immutable` → `yarn format:check` → `yarn lint` → `yarn typecheck` → `yarn test:cov` (80% coverage gate) → `yarn build`.
- **`e2e-tests`**: installs Chromium (cached by Playwright version), then `CI=true yarn test:e2e` against the production build.
- **`validate-branch`** and **`validate-commit`**: the PR conventions (see [PR checks](#pr-checks)).

Run the same gate locally before opening a PR:

```bash
yarn format:check && yarn lint && yarn typecheck && yarn test:cov && yarn build && CI=true yarn test:e2e
```

Each run's **Artifacts** (Actions → run) hold the HTML coverage report (`coverage-report`, also when a test or the coverage gate fails) and, when the e2e tests fail, the Playwright report (`playwright-report`; open it with `yarn playwright show-report <unzipped folder>`).

The workflow uses a read-only `GITHUB_TOKEN`, pins third-party actions to commit SHAs and cancels outdated runs on the same branch. It needs no secrets: the e2e tests mock every API call.

### PR checks

The conventions from [`CLAUDE.md`](CLAUDE.md) are checked on every pull request by small Bash scripts in [`.github/scripts/`](.github/scripts/), each tested by a Vitest spec next to it (Vitest project `scripts`, run by `yarn test`).

| Job                    | Rule                                                                                                                                                                            |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `validate-branch`      | The source branch is `main`, `develop`, `release/<version>` (e.g. `release/1.2.3`) or `<type>/<issue-number>-<slug>`, lowercase and hyphenated.                                 |
| `validate-commit`      | The PR has **exactly one commit**, and every non-merge commit is titled `#<issue-number>: <description>`. `release/*` → `main` and `main` → `develop` may have several commits. |
| `validate-release-tag` | Only for `release/*` → `main`: the `version` in `package.json` hasn't been released yet (no `tag_v-<version>.*` tag on GitHub). Skipped for every other PR.                     |

Allowed `<type>` prefixes: `feature`, `bugfix`, `hotfix`, `chore`, and `ai`, `copilot`, `cursor`, `claude`, `codex` for branches created by AI tools.

To squash a PR into one commit:

```bash
git fetch origin
git reset --soft $(git merge-base origin/<base-branch> HEAD)
git commit -m "#<issue-number>: <description>"
git push --force-with-lease
```

Run a check locally, e.g. `HEAD_REF=my-branch bash .github/scripts/validate-branch.sh`.

The scripts are shared with `numo-api` (same files in its `.github/scripts/`): change them in both repos together.

### Branch protection

`main` and `develop` both require a pull request (no approval needed, so a solo maintainer can merge their own) whose `node-ci`, `e2e-tests`, `validate-branch` and `validate-commit` checks pass on the latest base. `main` also requires `validate-release-tag` (skipped, which counts as passed, for anything but release PRs).

- On **`main`** the rules apply to admins too (no bypass).
- On **`develop`** an admin can bypass them. That's only for the `main` → `develop` sync PR, which gets no CI run (see [main → develop sync](#main--develop-sync)). Every other PR into `develop` must pass its checks.

GitHub only offers a check as required after it has run once, so a repository admin sets this once (for `validate-release-tag`, after the first release PR):

```bash
protect() { # <branch> <enforce_admins> <checks…>
  local branch=$1 enforce_admins=$2; shift 2
  gh api -X PUT "repos/spreadcode-dev/numo-web/branches/$branch/protection" --input - <<JSON
{
  "required_status_checks": { "strict": true, "contexts": $(printf '%s\n' "$@" | jq -R . | jq -sc .) },
  "enforce_admins": $enforce_admins,
  "required_pull_request_reviews": { "required_approving_review_count": 0 },
  "restrictions": null
}
JSON
}
protect main true node-ci e2e-tests validate-branch validate-commit validate-release-tag
protect develop false node-ci e2e-tests validate-branch validate-commit
```

Check it with `gh api repos/spreadcode-dev/numo-web/branches/<branch>/protection --jq '{checks: .required_status_checks.contexts, admins: .enforce_admins.enabled}'`.

#### One-time setup of `develop`

Run once, after the PR that adds these checks is merged into `main`:

```bash
git fetch origin
git push origin origin/main:refs/heads/develop
gh api -X PATCH repos/spreadcode-dev/numo-web -f default_branch=develop
```

Then apply the branch protection above.

## Releases

Every push to `main` is tagged `tag_v-<version>.<build>` by the **Release** workflow ([`.github/workflows/release.yml`](.github/workflows/release.yml)). `<version>` comes from `package.json` and `<build>` is the commit's UTC time as `YYYYMMDDHHMM`, e.g. `tag_v-0.1.0.202611101845`. The build part keeps tags unique even when a hotfix doesn't bump the version. Re-running the workflow for the same commit skips the existing tag. There's no deploy yet: the tag is the release.

The tagging job is the only one with write access (`contents: write`), and it runs no project code or dependencies, just Git and jq.

To release:

1. Cut `release/x.y.z` from `develop`.
2. Bump the version on it: `yarn version x.y.z` (or `yarn version patch|minor|major`), then commit `#<issue-number>: Release x.y.z`.
3. Open a PR into `main`. `validate-release-tag` fails if `x.y.z` was already released.
4. Merge it with a **merge commit**. The Release workflow tags the merge commit.
5. Merge the `main` → `develop` sync PR that opens automatically (see below).

For a hotfix, branch `hotfix/<issue-number>-<slug>` from `main`, bump the patch version in the same commit as the fix, and open a PR into `main`.

List releases with `git ls-remote --tags origin 'tag_v-*'`, or check one version locally with `bash .github/scripts/validate-release-tag.sh <version>`.

### main → develop sync

After every push to `main` (release or hotfix), the **Sync main into develop** workflow ([`.github/workflows/sync-main-develop.yml`](.github/workflows/sync-main-develop.yml)) checks whether `develop` is missing commits from `main`. If it is, it opens a PR `Sync Release <version> (main into develop)` and lists the missing commits in the run log. If `develop` is up to date it does nothing, and if a sync PR is already open it doesn't open another: the open PR picks up the new commits. It never pushes to `develop` or merges by itself.

- **Merge the sync PR with a merge commit**, not squash, to keep the release history on `develop`.
- **No CI runs on it.** PRs opened with the workflow's `GITHUB_TOKEN` don't trigger other workflows, so PR Validation doesn't run and the required checks never report. The commits were already validated on their way to `main`, so an admin reviews it and merges it with **"Merge without waiting for requirements to be met (bypass rules)"**. Only `develop` allows that bypass (see [Branch protection](#branch-protection)).
- **Required repo setting:** "Allow GitHub Actions to create and approve pull requests" (Settings → Actions → General). Without it, `gh pr create` fails. Check it with `gh api repos/spreadcode-dev/numo-web/actions/permissions/workflow` (`can_approve_pull_request_reviews: true`), and enable it with:

```bash
gh api -X PUT repos/spreadcode-dev/numo-web/actions/permissions/workflow \
  -f default_workflow_permissions=read -F can_approve_pull_request_reviews=true
```

## Pre-commit hook

`yarn install` installs a [Husky](https://typicode.github.io/husky/) `pre-commit` hook that runs [lint-staged](https://github.com/lint-staged/lint-staged) on the **staged** files only:

- `*.ts` / `*.tsx`: `oxlint --fix`, then `prettier --write`. A lint error that can't be auto-fixed blocks the commit.
- `*.json`, `*.md`, `*.yml`, `*.yaml`, `*.css`: `prettier --write`.

Fixes are added to the commit automatically. Don't skip the hook with `--no-verify`; fix the error instead.

## UI components

Screens are built from [gluestack-ui v4](https://v4.gluestack.io/ui/docs/home/overview/introduction) components (NativeWind + Tailwind CSS, rendered through `react-native-web`). The generated components live in `src/components/ui/`. Add one with:

```bash
yarn dlx gluestack-ui@3.0.12 add <name> --use-yarn --path src/components/ui
```

Versions are pinned exactly. See [`CLAUDE.md`](CLAUDE.md#ui-kit-gluestack-ui-v4) for why v4, and for the Next.js and Vitest wiring.

## Project structure and conventions

See [`CLAUDE.md`](CLAUDE.md): Clean Architecture by feature (`src/app/` for thin routes, `src/features/<feature>/` for the code), UI and test conventions.
