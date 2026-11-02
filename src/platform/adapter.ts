import type {
  Finding,
  PlatformId,
  ScanContext,
  ScanResult,
} from "../domain/types";
export interface PlatformAdapter {
  readonly id: PlatformId;
  scan(context: ScanContext): Promise<ScanResult>;
  explain(path: string): Promise<never>;
  planRemoval(
    findings: Finding[],
    dryRun: boolean,
  ): Promise<import("../domain/types").RemovalPlan>;
}
