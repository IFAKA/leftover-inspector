# User guide

```sh
bun install
bun run dev -- scan
bun run dev -- scan --dry-run
bun run dev -- scan --json report.json
bun run dev -- scan --tui
```

The default scan only reads configured roots. Findings include evidence, state, confidence, risk, size, and a recommendation. Review uncertain and shared findings manually. A cleanup implementation must present exact paths and require confirmation before moving user-owned files into recovery storage; launchd admin operations require a separate explicit approval. Recovery manifests contain original and destination paths and can be used to restore moved items.

## TUI controls

Run `bun run dev -- scan --tui` (or simply `bun run dev -- scan` from a TTY).
The interface follows Vim-style navigation: `j`/`k` move, `g`/`G` jump to the
ends, `Ctrl-d`/`Ctrl-u` page, `Space` selects, `/` searches, `Enter` opens
details, `y` copies the current path, `d` previews selected actions, `?` opens
help, and `q` quits. Press `Esc` to leave search, details, help, or a preview.
The detail panel starts with a plain-language explanation and then shows the
technical evidence, exact path, confidence, risk, and recommendation. The
findings list is a bounded, scrollable viewport with native scrollbars and
viewport culling to keep interaction responsive with large scans.
