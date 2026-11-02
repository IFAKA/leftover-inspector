# Leftover Inspector Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement the product and architecture specifications in this repository as a safe, evidence-backed cross-platform leftovers inspector with a polished OpenTUI interface.

**Architecture:** Bun/TypeScript application with OpenTUI presentation, platform-neutral domain services, and isolated OS adapters. macOS is the first complete adapter; Linux and Windows begin scan-only and gain mutation support only after adapter-specific security tests pass.

**Tech Stack:** Bun, TypeScript, OpenTUI (`@opentui/core`), Vitest, Biome, GitHub Actions, native filesystem/process APIs.

---

## GitHub spec-driven development protocol

Every feature must follow this sequence:

1. Create or update a spec in `docs/specs/`.
2. Open a GitHub issue using the spec template with problem, scope, acceptance criteria, security impact, and test plan.
3. Create a branch named `feat/<issue-number>-<short-name>` or `fix/<issue-number>-<short-name>`.
4. Add failing tests before implementation.
5. Implement the smallest change satisfying the acceptance criteria.
6. Run local checks and attach the exact commands/results to the pull request.
7. Open a PR linking the issue with `Closes #<number>`.
8. Obtain review from code owners for platform deletion code and security-sensitive changes.
9. Merge only after required CI, review, and acceptance checklist pass.
10. Update the spec and changelog before release.

No issue, spec, tests, or acceptance criteria may be skipped for a feature that mutates files or invokes privilege escalation.

## GitHub repository setup

**Files:**

- Create: `.github/ISSUE_TEMPLATE/feature.yml`
- Create: `.github/ISSUE_TEMPLATE/bug.yml`
- Create: `.github/PULL_REQUEST_TEMPLATE.md`
- Create: `.github/CODEOWNERS`
- Create: `.github/workflows/ci.yml`
- Create: `.github/workflows/security.yml`
- Create: `.github/dependabot.yml`
- Create: `CONTRIBUTING.md`
- Create: `SECURITY.md`

Required issue fields: spec link, platform, mutation risk, acceptance criteria, fixtures, and rollback plan.

Required PR fields: issue link, user-visible behavior, tests added, commands run, permissions used, paths touched, and whether any destructive behavior changed.

## Milestone 1: Repository and CLI foundation

### Task 1.1: Scaffold package and scripts

**Files:** `package.json`, `tsconfig.json`, `biome.json`, `src/main.ts`, `src/cli.ts`, `tests/unit/cli.test.ts`

Write failing tests for command parsing: `scan`, `report`, `clean`, `history`, `version`, `--json`, `--dry-run`, `--fixture`, and `--no-color`.

Implement Bun scripts:

```json
{
  "dev": "bun run src/main.ts",
  "test": "bun test",
  "typecheck": "tsc --noEmit",
  "lint": "biome check .",
  "format": "biome format --write .",
  "build": "bun build src/main.ts --compile --outfile dist/leftover-inspector"
}
```

Run: `bun test tests/unit/cli.test.ts && bun run typecheck`.

### Task 1.2: Add OpenTUI shell

**Files:** `src/app.ts`, `src/ui/model.ts`, `src/ui/keymap.ts`, `tests/unit/ui-model.test.ts`

Implement renderer lifecycle, terminal-size handling, Ctrl-C, quit confirmation when a plan is selected, and a fixture-only empty state.

Run: `bun test tests/unit/ui-model.test.ts && bun run dev -- --fixture tests/fixtures/empty`.

Acceptance: UI starts, displays an empty report, and exits cleanly.

## Milestone 2: Domain and evidence engine

### Task 2.1: Define domain types

**Files:** `src/domain/finding.ts`, `src/domain/application.ts`, `src/domain/evidence.ts`, `src/domain/operations.ts`, `tests/unit/domain-types.test.ts`

Define the models in `docs/specs/001-product-spec.md`. Validate paths, IDs, enum values, and action invariants. A finding without evidence cannot be actionable.

Run: `bun test tests/unit/domain-types.test.ts`.

### Task 2.2: Implement correlation and scoring

**Files:** `src/domain/correlate.ts`, `src/domain/score.ts`, `src/domain/policy.ts`, `tests/unit/correlation.test.ts`, `tests/unit/scoring.test.ts`

Implement ordered evidence strength and conservative confidence/risk rules. Add fixtures for exact bundle IDs, missing apps, generic names, shared directories, and system-owned files.

Run: `bun test tests/unit/correlation.test.ts tests/unit/scoring.test.ts`.

Acceptance: ambiguous results are `uncertain` and default to `inspect`/`ignore`.

## Milestone 3: macOS scanner

### Task 3.1: Implement filesystem inventory

**Files:** `src/platform/macos/paths.ts`, `src/platform/macos/bundles.ts`, `src/platform/macos/preferences.ts`, `tests/integration/macos/filesystem-scan.test.ts`, `tests/fixtures/macos/`

Scan only configured roots. Use injectable filesystem access in tests. Detect app bundles, support folders, preferences, containers, saved state, caches, and logs. Do not classify caches/logs as app leftovers without separate evidence.

Run: `bun test tests/integration/macos/filesystem-scan.test.ts`.

### Task 3.2: Implement plist and launchd inspection

**Files:** `src/platform/macos/plist.ts`, `src/platform/macos/launchd.ts`, `tests/integration/macos/launchd-scan.test.ts`, `tests/fixtures/macos/launchd/`

Parse plist label, `Program`, `ProgramArguments`, ownership, and source path. Query loaded domains only when available. Distinguish configured, loaded, running, disabled, and inaccessible. A missing executable plus absent owning app is a likely orphan; a loaded security/VPN/system job is not.

Run: `bun test tests/integration/macos/launchd-scan.test.ts`.

### Task 3.3: Implement Homebrew evidence adapter

**Files:** `src/platform/macos/homebrew.ts`, `tests/integration/macos/homebrew.test.ts`, `tests/fixtures/macos/homebrew/`

Parse `brew list`, `brew info`, caskroom paths, and cask artifact state through an injectable command runner. Detect broken staging such as a registered cask whose app bundle is missing or empty. Never treat a Homebrew record alone as proof that an app is used.

Run: `bun test tests/integration/macos/homebrew.test.ts`.

## Milestone 4: Read-only reporting and OpenTUI review

### Task 4.1: Build report pipeline

**Files:** `src/report/json.ts`, `src/report/text.ts`, `src/scan.ts`, `tests/unit/report.test.ts`

Produce stable JSON with schema version, host platform, scan timestamp, permissions, findings, errors, and summary. Redact usernames where requested; preserve exact paths in local output.

Run: `bun test tests/unit/report.test.ts`.

### Task 4.2: Build findings table and detail view

**Files:** `src/ui/components/summary.ts`, `src/ui/components/findings-table.ts`, `src/ui/components/detail-panel.ts`, `src/ui/components/filters.ts`, `tests/unit/ui-navigation.test.ts`

Provide categories, search, sorting, risk/confidence badges, selection, evidence details, path copy/open, and rescan. Show “why this is a candidate” in plain language.

Run: `bun test tests/unit/ui-navigation.test.ts && bun run dev -- --fixture tests/fixtures/macos/basic`.

Acceptance: no action is selected by default for `uncertain`, `shared`, `system-owned`, or `elevated` findings.

## Milestone 5: Safe actions

### Task 5.1: Implement dry-run planner

**Files:** `src/actions/planner.ts`, `src/actions/validation.ts`, `tests/unit/action-planner.test.ts`, `tests/security/path-validation.test.ts`

Create exact action plans. Reject relative paths, traversal, symlink targets, protected roots, credential paths, and shared directories. Dry-run must not call mutation APIs or privileged commands.

Run: `bun test tests/unit/action-planner.test.ts tests/security/path-validation.test.ts`.

### Task 5.2: Implement macOS Trash/quarantine

**Files:** `src/actions/trash.ts`, `src/actions/quarantine.ts`, `src/platform/macos/actions.ts`, `tests/integration/macos/actions.test.ts`

Move user-owned selected paths to Trash or a dated recovery directory. Record original path, destination, file metadata, and operation result. Stop on errors and preserve a rollback manifest.

Run: `bun test tests/integration/macos/actions.test.ts`.

### Task 5.3: Implement launchd admin workflow

**Files:** `src/platform/macos/privilege.ts`, `src/platform/macos/launchd-actions.ts`, `tests/security/launchd-actions.test.ts`

Plan `bootout`/unload before moving a launchd plist. Display the exact domain and path. Never invoke `sudo` implicitly from a scan. Require explicit user confirmation and report when the current session cannot obtain authorization.

Run: `bun test tests/security/launchd-actions.test.ts`.

## Milestone 6: Cross-platform scan adapters

### Task 6.1: Add adapter contract and platform detection

**Files:** `src/platform/adapter.ts`, `src/platform/detect.ts`, `tests/unit/platform-contract.test.ts`

Require scan, evidence, report, and action-plan methods from every adapter. Unsupported mutation operations must return structured `unsupported`, never silently fall back to deletion.

### Task 6.2: Add Linux scan-only adapter

**Files:** `src/platform/linux/paths.ts`, `src/platform/linux/scan.ts`, `tests/integration/linux/scan.test.ts`, `tests/fixtures/linux/`

Implement XDG directories, desktop/autostart entries, and package records with fixture injection. Do not mutate systemd or package-manager state in this milestone.

### Task 6.3: Add Windows scan-only adapter

**Files:** `src/platform/windows/paths.ts`, `src/platform/windows/scan.ts`, `tests/integration/windows/scan.test.ts`, `tests/fixtures/windows/`

Implement AppData, installed-app records, startup items, and scheduled-task evidence through injectable platform APIs. Do not mutate registry or scheduled tasks in this milestone.

Run: `bun test && bun run typecheck`.

## Milestone 7: Security, release, and documentation

### Task 7.1: Add security tests and threat model

**Files:** `SECURITY.md`, `tests/security/`, `.github/workflows/security.yml`

Test path traversal, symlink escape, shell argument injection, malformed plist/JSON, hostile filenames, permission failures, and interrupted transactions. Document that paths are untrusted input and commands use argument arrays, never shell interpolation.

### Task 7.2: Add CI and release checks

**Files:** `.github/workflows/ci.yml`, `.github/workflows/release.yml`, `.github/dependabot.yml`, `.github/CODEOWNERS`

Required CI:

```sh
bun install --frozen-lockfile
bun run lint
bun run typecheck
bun test
bun run build
```

Add fixture scans, no-mutation tests, dependency audit, and artifact verification. Do not publish credentials or host-specific scan reports.

### Task 7.3: Complete user documentation

**Files:** `README.md`, `CONTRIBUTING.md`, `docs/user-guide.md`, `docs/platform-support.md`, `CHANGELOG.md`

Document installation, read-only scanning, dry-run, review workflow, Trash recovery, admin permissions, unsupported platform operations, JSON schema, troubleshooting, and uninstalling the tool itself.

## Definition of done

- Product and architecture specs are accepted and linked to GitHub issues.
- Every implementation task has tests written before implementation.
- macOS read-only scanning identifies the current Disk Drill/Data Rescue failure mode as broken/incomplete evidence rather than guessing.
- No scan path mutates the host.
- Every mutation has dry-run, confirmation, recovery, and manifest behavior.
- System, shared, credential, and uncertain paths are protected by default.
- CI passes on every PR.
- A reviewer can reproduce the example reports using fixtures without owning a Mac.
- The release artifact starts on a clean supported machine and clearly reports missing permissions or unsupported operations.

