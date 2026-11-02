import { planRemoval } from "./actions/planner";
import { startTui } from "./app";
import { jsonReport } from "./report/json";
import { textReport } from "./report/text";
import { scan } from "./scan";
export interface CliOptions {
  command: "scan" | "report" | "clean" | "history" | "version";
  json?: string;
  dryRun: boolean;
  fixture?: string;
  noColor: boolean;
  tui?: boolean;
}
export function parseArgs(args: string[]): CliOptions {
  const command = (args.find((a) => !a.startsWith("-")) ??
    "scan") as CliOptions["command"];
  const get = (flag: string) => {
    const i = args.indexOf(flag);
    return i >= 0 ? args[i + 1] : undefined;
  };
  return {
    command,
    json: get("--json"),
    dryRun: args.includes("--dry-run"),
    fixture: get("--fixture"),
    noColor: args.includes("--no-color"),
    tui: args.includes("--tui"),
  };
}
export async function runCli(args: string[]): Promise<number> {
  const o = parseArgs(args);
  if (o.command === "version") {
    console.log("leftover-inspector 0.1.0");
    return 0;
  }
  if (o.command !== "scan" && o.command !== "report") {
    console.log(
      `${o.command}: history and cleanup UI are available through the TUI; scan remains read-only.`,
    );
    return 0;
  }
  try {
    const r = await scan({ roots: o.fixture ? [o.fixture] : undefined });
    if (o.tui || (process.stdin.isTTY && process.stdout.isTTY && !o.json)) {
      await startTui(r.findings, o.dryRun);
      return 0;
    }
    const output = o.json ? jsonReport(r) : textReport(r);
    if (o.json) await Bun.write(o.json, output);
    else console.log(output);
    if (o.dryRun) {
      const plan = planRemoval(r.findings, true);
      console.log(
        `\nDry run: ${plan.items.length} action(s), ${plan.errors.length} rejected.`,
      );
    }
    return 0;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(
      `leftover-inspector: ${message}\nNo files were changed. Re-run with the same command after fixing the reported issue.`,
    );
    return 1;
  }
}
