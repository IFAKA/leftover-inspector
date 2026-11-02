# Contributing

Use Bun 1.3+ and work from fixtures only. Add a failing test before implementation, keep platform-specific behavior in its adapter, and run `bun run lint`, `bun run typecheck`, and `bun test` before submitting. Security-sensitive or mutating changes require a fixture-based interrupted-transaction and protected-path test.
