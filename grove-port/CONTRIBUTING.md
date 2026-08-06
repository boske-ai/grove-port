# Contributing to Grove Port

Grove Port is MIT: the spec, schema, core, adapters, and CLI. Contributions are welcome — especially **new IN adapters**, which are the most useful thing you can add.

Security issue? Don't open a public issue — see [SECURITY.md](./SECURITY.md).

---

## Setup

```bash
bun install
bun run build
bun test
```

Requires [Bun](https://bun.sh). The full check, the same one CI runs:

```bash
bun run build && bunx tsc -p tsconfig.test.json --noEmit && bun test
```

---

## Ground rules

These come from [AGENTS.md](./AGENTS.md) and apply to humans and AI assistants alike.

1. **Plan before non-trivial code.** Open an issue or add a work folder under [`docs/work/active/`](./docs/work/) with a `README.md` and `plan.md`. Saves you from building something we'd have to reject.
2. **Docs travel with behavior.** A behavior change updates the doc describing it in the same PR. Wire-format changes update [`spec/v1/`](./spec/v1/).
3. **Small, focused PRs.** No drive-by refactors.
4. **Test-driven where tests apply.** Failing test first.
5. **Fail fast.** No silent defaults that paper over a misconfiguration.
6. **Archive, don't delete.** Retired code moves to `_archive/` via `git mv`.

---

## Treat every input as hostile

Adapters parse files that arrived from somewhere else, and `verify` parses packages from strangers. Non-negotiable:

- **Never call `unzipSync` directly.** Use `unzipSyncWithBudgets` from `@grove-port/core/browser`. CI-adjacent review will catch a raw call.
- **Bound every traversal.** Vendor exports reference nodes by id, so `JSON.parse` reproduces cycles happily. Every walk needs a `visited` set, and recursion over user-controlled depth needs to be iterative. See [`flatten-mapping.ts`](./packages/adapters/chatgpt/src/flatten-mapping.ts) for the pattern.
- **No unbounded reads.** Check a size before parsing.
- **Never interpolate untrusted data into HTML.** `textContent`, not `innerHTML`.
- **Ship a hostile-input test.** Adapters have a `hostile-graph.test.ts`; add cases to yours.

---

## Adding an IN adapter

Copy the closest existing adapter — [`lobechat`](./packages/adapters/lobechat/) is a good small one.

1. `packages/adapters/<vendor>/` with `package.json`, `tsconfig.json` (including `"exclude": ["src/**/*.test.ts"]`), and `src/`.
2. Split it the way the others are: `load-input-bytes.ts` (parse, browser-safe) · `convert-bytes.ts` (map to Grove Port) · `convert.ts` (Node file wrapper) · `browser.ts` (browser entry) · `types.ts`.
3. Build the manifest with `buildAdapterManifest()` from `@grove-port/core/browser` — don't hand-roll the block.
4. Register in [`packages/cli/src/adapters.ts`](./packages/cli/src/adapters.ts), [`packages/convert-browser/src/index.ts`](./packages/convert-browser/src/index.ts), and the detection scoring in [`detect.ts`](./packages/convert-browser/src/detect.ts).
5. Add a **synthetic** fixture and a `convert.test.ts` that round-trips through `unpackAndVerifyEnvelope`.
6. Document honestly in [`apps/converter-web/src/compatibility.ts`](./apps/converter-web/src/compatibility.ts) — including what does *not* import.

### Never commit real exports

Fixtures must be synthetic. No real conversations, no real names, emails, or scraped web content — yours or anyone's. This repo is public; a fixture is forever.

---

## Style

No linter is configured, so match the file you're editing: 2-space indent, single quotes, semicolons, 100-ish column soft wrap, named exports, `type`-only imports where applicable. `.editorconfig` covers whitespace.

Comments explain **why**, not what. If a line looks odd but is deliberate, say why — that's what makes the security-sensitive code reviewable.

---

## License

Contributions are MIT, matching [LICENSE](./LICENSE).
