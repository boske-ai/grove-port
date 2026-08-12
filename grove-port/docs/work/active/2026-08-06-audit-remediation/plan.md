# Plan: Audit remediation

**Status:** Approved  
**Approved:** 2026-08-06  
**Source:** Aug 2026 full-repo audit (trust model, adapter DoS, quadratic walks, no CI)

---

## Goal

Every audit finding closed, each with a regression test, and CI in place so none of it silently comes back.

---

## Owned paths

| Area | Paths |
|------|-------|
| Core | `packages/core/src/{envelope,crypto,canonical,tar-budgets,path-safe,adapter-manifest}.ts` |
| Schema | `packages/schema/src/v1.ts` |
| Adapters | `packages/adapters/*/src/{select-lineage,flatten-*,convert-bytes}.ts` |
| CLI | `packages/cli/src/{cli,adapters}.ts` |
| Web | `apps/converter-web/src/*.ts` |
| Spec / docs | `spec/v1/README.md`, `SECURITY.md`, `CONTRIBUTING.md`, `README.md` |
| CI | `.github/workflows/ci.yml` |

**Hot files (serial):** `packages/core/src/envelope.ts`, `packages/schema/src/v1.ts`

---

## Waves

### Wave 1 — Trust & integrity (core + schema)

1. Verify the signature over the **raw manifest bytes as they exist on disk**, not the Zod-parsed object. Kills two findings at once: unsigned extra keys, and schema defaults silently breaking old signatures.
2. Remove the `workspace_items` manifest-count default that broke every pre-change package.
3. `README.md` must appear in `manifest.checksums` when present — no unverified content inside a verified envelope.
4. Abort the tar stream on first budget refusal instead of draining it.
5. Reject non-file `attachments/` members with a clear error instead of a raw `EISDIR`.

### Wave 2 — Adapter hardening

1. Cycle guards on all five lineage walks (chatgpt, deepseek, openwebui, claude, librechat).
2. Memoize subtree-max scans → linear instead of quadratic.
3. Validate ChatGPT `mapping` before staging assets so the friendly error wins.

### Wave 3 — Shared adapter scaffold

Extract `buildAdapterManifest()` + `AdapterExportStats` into core; adopt in all nine adapters. Scope is the **manifest block only** — the thing that had to be edited in ten places when `workspace_items` landed. Not a full adapter framework (AGENTS.md: no drive-by refactors).

### Wave 4 — CLI, web, build hygiene

1. `Object.hasOwn` adapter-name guard; flag-aware argument parsing.
2. CLI + `inspect` state `signature_trust: self-signed`.
3. Worker caches the inflated ZIP (one inflate, not three); deferred `revokeObjectURL`; worker terminated on cancel; upload size cap.
4. `exclude` tests from `convert-browser` / `cli` tsconfigs.

### Wave 6 — `--expect-key` (added after the main waves landed)

Trusted-key pinning in core (`expectedPublicKeys`), surfaced as a repeatable
`--expect-key` on `verify` and `inspect`. Signature is verified *first*, then the
key pinned, so a tampered package reports tampering rather than an untrusted key.

Scoped deliberately: this helps Boske→Boske and backup-restore, where the
receiving side knows the expected key. It does **not** help the consumer funnel —
`convert` signs with a throwaway key that is discarded immediately, so those
packages cannot be pinned. That asymmetry is now documented rather than implied.

### Wave 5 — Spec, docs, process

Spec signature section corrected to match the implementation; budgets, trust model, and layout allowlist documented; `SECURITY.md`, `CONTRIBUTING.md`, `.editorconfig`; npm metadata + version alignment; synthetic ChatGPT fixtures; stale work folders archived; CI hardened.

---

## Explicit non-goals

- ~~`--expect-key` / trusted-key allowlist.~~ **Built after all** (Wave 6) once the audit work was committed as a clean checkpoint.
- A lint/format toolchain. Adding one now either fails CI on existing code or forces a repo-wide reformat that would bury these fixes. `.editorconfig` only.
- Deleting `_archive/mistral`. AGENTS.md says archive, don't delete, and ADR 0001 links to it. Its raw `unzipSync` is wired to the budgeted helper so no unbudgeted inflate path exists anywhere in the tree.

---

## Done when

- [x] Every audit PoC re-run and confirmed closed
- [x] Regression test per finding
- [x] `bun test` green (151), `bun run build` clean, `tsc -p tsconfig.test.json` clean
- [x] CI runs build + typecheck + test on PR (root `.github/workflows/grove-port-ci.yml`)

## Tests

```bash
bun test
bun run build
bunx tsc -p tsconfig.test.json --noEmit
```
