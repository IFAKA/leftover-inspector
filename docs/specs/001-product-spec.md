# Leftover Inspector — Product Specification

Status: Draft for implementation
Owner: Project maintainers
Target: macOS first; Linux and Windows follow-up adapters

## Problem

Operating-system cleanup tools are good at finding caches, logs, and temporary files. They are less reliable at explaining application leftovers: launch agents, privileged helpers, package-manager records, preferences, application-support directories, staged app bundles, and vendor files that remain after an uninstall fails.

The user needs an evidence-backed answer to four questions:

1. What is this file or service?
2. Which installed or previously installed application owns it?
3. Is it safe and necessary?
4. What exactly will happen if I remove it, and can I undo that?

## Product goal

Build a terminal-first, cross-platform inspector that discovers application remnants, explains its evidence, and lets users review reversible cleanup actions. The tool must be conservative: uncertainty produces a review item, never an automatic deletion.

## Non-goals for v1

- Automatic deletion of arbitrary caches, logs, or temporary files.
- Replacing vendor uninstallers.
- Removing system-owned files or security software automatically.
- Guessing that an app is unused based only on age or absence of a running process.
- Sending telemetry, uploading paths, or requiring an account.
- Claiming perfect ownership of shared directories.

## User stories

- As a Mac user, I can scan my computer without changing anything.
- As a user, I can filter findings by app, platform area, confidence, risk, and estimated size.
- As a user, I can open a finding and see its exact path, ownership evidence, current state, and recommendation.
- As a user, I can preview a proposed cleanup and see every path before confirmation.
- As a user, I can move selected user-owned files to Trash or a recovery quarantine.
- As a user, I can explicitly approve an administrator action such as unloading a launch daemon.
- As a user, I can export a JSON report for support or issue filing.
- As a developer, I can add a Linux or Windows scanner without changing the domain model or TUI.

## Safety requirements

- Default mode is read-only scan.
- Every action supports `--dry-run`.
- No destructive action is available without an explicit confirmation screen.
- User-owned files go to Trash/quarantine by default, not direct unlink.
- System-owned paths, credentials, SSH keys, browser profiles, databases, and shared support folders are protected by default.
- Symlinks are never followed during deletion; the link itself is inspected and handled separately.
- Privileged actions are isolated behind an adapter and require a second confirmation showing the command and paths.
- The tool records an operation manifest with original path, destination, checksum when practical, timestamp, and result.
- The tool never logs file contents or secrets.
- A failed operation must stop further mutation and report exactly what succeeded.

## Supported discovery areas

### macOS v1

- `/Applications`, `~/Applications`, and configurable app roots.
- `~/Library/LaunchAgents`, `/Library/LaunchAgents`, `/Library/LaunchDaemons`.
- Application Support, Preferences, Containers, Group Containers, Caches, Logs, and Saved Application State.
- Privileged helper tools and launchd program paths.
- Homebrew formulae/casks and Caskroom staging records when Homebrew is present.
- Package receipts as evidence only; never remove receipts automatically.
- Running/loaded launchd domains using `launchctl print` where permissions allow.

### Linux v1.1 adapter

- XDG config/data/cache/state paths.
- Desktop entries and user/system autostart entries.
- Common package-manager records where available.
- systemd user units as scan-only until removal semantics are tested.

### Windows v1.2 adapter

- `%AppData%`, `%LocalAppData%`, `%ProgramData%`.
- Start Menu uninstall records and installed-app registry records.
- Startup folders, Run keys, and scheduled tasks as scan-only until removal semantics are tested.

## Finding model

Each finding must contain:

- Stable `id` derived from platform, normalized path, and finding kind.
- `path` and path type.
- Candidate application identity: name, bundle/package ID, vendor, install paths.
- Evidence list with source, value, strength, and timestamp.
- State: `installed`, `missing-app`, `broken-install`, `shared`, `system-owned`, or `unknown`.
- Confidence: `certain`, `likely`, or `uncertain`.
- Risk: `safe`, `review`, or `elevated`.
- Size estimate and scan errors if incomplete.
- Recommended action: `ignore`, `inspect`, `trash`, `quarantine`, or `admin-required`.
- Human-readable explanation generated from structured evidence.

## Acceptance criteria

- A clean read-only scan makes no filesystem or launchd changes.
- An orphaned launchd plist pointing to a missing executable is detected and explained.
- A Homebrew cask with an empty or missing staged app is reported as a broken installation, not confidently classified as an uninstalled app.
- A matching installed app downgrades or removes the orphan recommendation.
- Shared support directories are never selected by default.
- A dry-run lists exact actions and performs zero mutations.
- A confirmed user-owned cleanup moves files to recovery storage and writes an operation manifest.
- A denied permission produces a visible partial-result warning, not a false clean result.
- Unit tests run without scanning the host machine.
- Fixture integration tests cover macOS, Linux, and Windows path rules.
- CI blocks merges on formatting, type errors, tests, security checks, and an accidental-mutation test.

