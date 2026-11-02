# Leftover Inspector — Architecture Specification

## Runtime choice

Use Bun and TypeScript with OpenTUI. OpenTUI supplies the native terminal renderer and TypeScript component API. Keep terminal rendering behind a UI boundary so scanners and actions remain testable without a TTY.

## Layers

```text
CLI entrypoint
  ├─ command parsing / output modes
  ├─ scan orchestration
  ├─ policy + correlation engine
  ├─ action planner / executor
  └─ OpenTUI presentation

Domain core
  ├─ Finding, Evidence, AppIdentity
  ├─ Scanner, Correlator, Policy interfaces
  ├─ RemovalPlan, OperationManifest
  └─ deterministic scoring and explanations

Platform adapters
  ├─ macOS: plist, launchd, bundle, Homebrew, Trash/quarantine
  ├─ Linux: XDG, desktop entries, package managers, systemd read-only
  └─ Windows: AppData, registry, startup, scheduled tasks read-only
```

## Repository layout

```text
leftover-inspector/
├── package.json
├── bun.lock
├── tsconfig.json
├── biome.json
├── LICENSE
├── README.md
├── SECURITY.md
├── CONTRIBUTING.md
├── src/
│   ├── main.ts
│   ├── cli.ts
│   ├── app.ts
│   ├── domain/
│   │   ├── finding.ts
│   │   ├── application.ts
│   │   ├── evidence.ts
│   │   ├── policy.ts
│   │   ├── correlate.ts
│   │   ├── score.ts
│   │   └── operations.ts
│   ├── platform/
│   │   ├── adapter.ts
│   │   ├── detect.ts
│   │   ├── macos/
│   │   ├── linux/
│   │   └── windows/
│   ├── actions/
│   │   ├── planner.ts
│   │   ├── executor.ts
│   │   ├── trash.ts
│   │   ├── quarantine.ts
│   │   └── privilege.ts
│   ├── report/
│   │   ├── json.ts
│   │   └── text.ts
│   └── ui/
│       ├── model.ts
│       ├── keymap.ts
│       └── components/
├── tests/
│   ├── unit/
│   ├── integration/
│   ├── fixtures/
│   └── security/
├── docs/specs/
└── docs/plans/
```

## Interfaces

```ts
export interface PlatformAdapter {
  readonly id: PlatformId
  scan(context: ScanContext): Promise<ScanResult>
  explain(path: string): Promise<Evidence[]>
  planRemoval(findings: Finding[], policy: Policy): Promise<RemovalPlan>
  execute(plan: RemovalPlan, confirmation: Confirmation): Promise<OperationManifest>
}
```

The domain must not call `launchctl`, `reg`, `systemctl`, `rm`, or package managers directly. Adapters own process execution and expose structured results.

## Correlation rules

Order evidence from strongest to weakest:

1. Exact bundle/package identifier match.
2. Executable path inside an installed app bundle.
3. Signed vendor/team identifier match.
4. Package-manager artifact ownership.
5. Vendor and normalized-name/path match.
6. Generic filename or directory name.

Only levels 1–3 can produce `certain` ownership. Levels 4–6 require additional corroboration.

## Action semantics

- `ignore`: no action.
- `inspect`: open details only.
- `trash`: move user-owned path to Trash or recovery directory.
- `quarantine`: move to an application-specific recovery directory and write manifest.
- `admin-required`: show exact privileged operation and require explicit approval.

Removal is a transaction with planned, executing, succeeded, failed, and rolled-back states.

