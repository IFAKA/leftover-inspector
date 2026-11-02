export type PlatformId = "macos" | "linux" | "windows";
export type FindingKind =
  | "launch-agent"
  | "launch-daemon"
  | "missing-executable"
  | "homebrew-cask"
  | "application-support"
  | "preference"
  | "container"
  | "privileged-helper"
  | "package-record"
  | "app-remnant"
  | "shared-directory"
  | "autostart"
  | "startup";
export type Confidence = "certain" | "likely" | "uncertain";
export type Risk = "safe" | "review" | "elevated";
export type FindingState =
  | "installed"
  | "missing-app"
  | "broken-install"
  | "shared"
  | "system-owned"
  | "unknown";
export type Action =
  | "ignore"
  | "inspect"
  | "trash"
  | "quarantine"
  | "admin-required";
export type PathType = "file" | "directory" | "symlink" | "missing";

export interface AppIdentity {
  name: string;
  bundleId?: string;
  vendor?: string;
  installPaths: string[];
  installed: boolean;
}
export interface Evidence {
  source: string;
  value: string;
  strength: 1 | 2 | 3 | 4 | 5 | 6;
  observedAt?: string;
}
export interface Finding {
  id: string;
  platform: PlatformId;
  kind: FindingKind;
  path: string;
  pathType: PathType;
  app?: AppIdentity;
  evidence: Evidence[];
  state: FindingState;
  confidence: Confidence;
  risk: Risk;
  sizeBytes?: number;
  scanErrors: string[];
  action: Action;
  explanation: string;
  selected?: boolean;
}
export interface ScanContext {
  fs: FileSystemLike;
  roots: string[];
  now?: Date;
  command?: CommandRunner;
  platform: PlatformId;
}
export interface ScanResult {
  platform: PlatformId;
  findings: Finding[];
  errors: string[];
  permissions: string[];
  scannedAt: string;
}
export interface FileStat {
  type: PathType;
  size: number;
  mode?: number;
}
export interface FileSystemLike {
  stat(path: string): Promise<FileStat>;
  readFile(path: string): Promise<string>;
  readdir(path: string): Promise<string[]>;
  exists(path: string): Promise<boolean>;
  move?(from: string, to: string): Promise<void>;
  mkdir?(path: string): Promise<void>;
}
export interface CommandRunner {
  run(
    file: string,
    args: string[],
  ): Promise<{ stdout: string; stderr: string; code: number }>;
}
export interface RemovalItem {
  findingId: string;
  source: string;
  destination: string;
  action: Action;
  privileged: boolean;
}
export interface RemovalPlan {
  items: RemovalItem[];
  dryRun: boolean;
  errors: string[];
}
export interface OperationEntry {
  originalPath: string;
  destination: string;
  timestamp: string;
  result: "moved" | "failed" | "skipped";
  recovery?: string;
  error?: string;
}
export interface OperationManifest {
  version: 1;
  operationId: string;
  startedAt: string;
  completedAt?: string;
  entries: OperationEntry[];
  rolledBack?: boolean;
}
