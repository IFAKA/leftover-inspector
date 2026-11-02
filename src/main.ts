import { runCli } from "./cli";

if (import.meta.main) process.exit(await runCli(process.argv.slice(2)));
