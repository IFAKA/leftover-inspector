# Leftover Inspector

Evidence-backed application-leftover discovery and safe cleanup from the terminal.

Leftover Inspector is a read-only-by-default Bun + TypeScript terminal inspector. It reports evidence-backed application remnants and provides conservative, reversible action planning.

## Development

```sh
bun install
bun run dev -- scan
bun run dev -- scan --dry-run
bun run dev -- scan --json report.json
bun run dev -- scan --tui
```

On an interactive terminal, `bun run dev -- scan` opens the TUI automatically. Use
`j`/`k` (or the arrow keys) to move, `Space` to select, `/` to search, `Enter` to
inspect, `d` for a read-only dry-run preview, `?` for the complete keyboard guide,
`y` to copy the current path, and `q` to quit. `g`/`G` jump to the first/last
finding and `Ctrl-d`/`Ctrl-u` page through large result sets. Details lead with
plain-language meaning and keep evidence and technical fields below it. The
findings list uses a bounded, scrollable viewport, so scans with many thousands
of findings do not create one giant terminal buffer.

`--fixture` supplies a test root. Scans never write to the host. Shared, system-owned, credential, browser, database, and uncertain paths are not selected automatically. The macOS adapter covers launch agents/daemons, application support, preferences, containers, helpers, and Homebrew evidence; Linux and Windows adapters are scan-only.

## Compiled executable

```sh
bun run build
./dist/leftover-inspector scan
```

The compiled binary does not require Bun, Zig, or this repository at runtime. Release artifacts are published for macOS Apple Silicon/Intel, Linux x64, and Windows x64 with `SHA256SUMS`. Download the matching artifact, verify it with `sha256sum -c SHA256SUMS`, then run it. The included installer is `./install.sh ./leftover-inspector`; it installs to `~/.local/bin` and does not require a global package manager.

Homebrew users may install a release binary from the project tap when one is published: `brew install <maintainer>/tap/leftover-inspector`.

See [`docs/user-guide.md`](docs/user-guide.md), [`docs/platform-support.md`](docs/platform-support.md), and [`SECURITY.md`](SECURITY.md).

## Support

If this project is useful to you, you can support my work:

[![Support me on Ko-fi](https://ko-fi.com/img/githubbutton_sm.svg)](https://ko-fi.com/zfaka)
