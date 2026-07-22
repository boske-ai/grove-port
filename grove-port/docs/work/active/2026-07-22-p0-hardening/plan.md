# Plan: P0 hardening

**Status:** Approved  
**Approved:** 2026-07-22  

**Started:** 2026-07-22  
**Source:** deep audit (verify path escape, ZIP/tar bombs, browser tar long-name/UTF-8)  
**Phase R:** complete (2026-07-22) — see notes below

---

## Goal

Make unpack/verify and vendor ZIP inflate **fail closed** on hostile or oversized inputs, and make browser-packed envelopes **round-trip** with Node verify for attachment-heavy ChatGPT exports.

---

## Phase R notes (merged)

- Checksum loop today: `packages/core/src/envelope.ts:99-111` — no confinement.
- Tar extract: `envelope.ts:79` bare `extract({ file, cwd })`; `data.json` parse unbounded (`124`).
- `unzipSync` sites: chatgpt, claude, librechat, gemini, doubao, deepseek, lobechat, anythingllm `load-input-bytes.ts` + `convert-browser/src/detect.ts:499`. **openwebui has no ZIP path** (skip). `_archive/mistral` out of scope.
- fflate `unzipSync` supports `filter(UnzipFileInfo)` **before** inflate (`originalSize`, etc.) — wrapper must **throw** on over-budget (filter `false` only skips).
- tar v7: use `filter` / `onReadEntry` to account sizes; no built-in total-byte cap.
- Browser gap: `pack-bytes.ts` raw `storage_name` vs Node `pack.ts` `path.basename`; `tar-gzip.ts` char-slice + 100-byte name only.
- Long names: prefer ustar `prefix` (155+100) if sufficient for ChatGPT `grove-port-v1/attachments/<id>-<name>`; fall back to PAX only if Node tar 7 needs it for round-trip — validate in Wave 4 tests.

---

## Proposed budgets (tunable constants)

Shared named constants (one module; document in adapter/core README briefly):

| Limit | Default (proposal) | Applies to |
|-------|-------------------|------------|
| Max ZIP entries | `10_000` | all `unzipSync` call sites |
| Max total uncompressed ZIP bytes | `512 * 1024 * 1024` (512 MiB) | same |
| Max single ZIP entry | `256 * 1024 * 1024` (256 MiB) | same |
| Max compressed/uncompressed ratio | `100:1` (reject if total uncompressed / compressed > 100 when compressed ≥ 1 MiB) | same |
| Max `.grove-port` file size before extract | `512 MiB` | `unpackAndVerifyEnvelope` |
| Max tar entries | `20_000` | tar extract |
| Max total extracted bytes | `512 MiB` | tar extract |
| Max `data.json` bytes | `128 MiB` | after extract, before `JSON.parse` |

If defaults feel wrong for product, adjust in this plan **before** approval — do not invent silent higher limits in code.

---

## Owned paths

| Area | Paths |
|------|-------|
| Core verify / pack | `packages/core/src/envelope.ts`, `pack-bytes.ts`, `tar-gzip.ts`, `browser.ts`, `index.ts` (+ new helper module e.g. `zip-budgets.ts` / `path-safe.ts`) |
| Core tests | `packages/core/src/*.test.ts` |
| Schema (if needed) | `packages/schema/src/v1.ts` — `storage_name` / checksum key pattern |
| Adapters (ZIP call sites only) | `packages/adapters/*/src/load-input-bytes.ts` (not `_archive/`) |
| Detect | `packages/convert-browser/src/detect.ts` |
| Docs | `TODO.md` (mark ZIP budgets row), brief note in `packages/core` README or `spec/v1` only if user-facing limits belong there |

**Hot files (serial):** `packages/core/src/envelope.ts`, `packages/schema/src/v1.ts`, `packages/core/src/index.ts`, `packages/core/src/browser.ts`

---

## Wave 1 — Verify path confinement + layout allowlist

**Owner:** `/packages-implementer` · `packages/core` (+ schema if regex added)

### Tasks

1. Reject checksum keys that are absolute, contain `..`, `\`, or NUL; require resolved path under envelope `root` (`path.resolve` + prefix check).
2. Allowlist checksum keys: `data.json` and `attachments/<safe-basename>` only (same basename rules as Node `pack.ts`).
3. Optionally reject unexpected top-level members under envelope root beyond `manifest.json`, `data.json`, `signature.sig`, `README.md`, `attachments/` (fail closed).
4. **TDD:** malicious checksum key → throws before hashing; happy path fixtures still verify.

### Done when

- [x] Crafted absolute / `../` checksum key fails verify with clear error
- [x] Valid ChatGPT/Boske-compat fixtures still pass
- [x] No read of files outside extract dir (symlink guards on all verify reads; tar extract still Wave 3)

### Wave 1b (Phase V blockers)

- [x] `..` rejected as path **segment** only (allow `attachments/foo..bar.jpg`)
- [x] `lstat` / reject symlinks before `sha256HexFile`

### Wave 1c (Phase V residual)

- [x] `assertPathSafeForHash` before manifest / signature / data.json `readFile`
- [x] Require `data.json` in `manifest.checksums` at verify time

---

## Wave 2 — Shared ZIP budgets + wire all inflate sites

**Owner:** `/packages-implementer`

### Tasks

1. Add `unzipSyncWithBudgets(bytes, limits?)` (or equivalent) in `@grove-port/core` browser-safe surface (adapters already depend on core + fflate).
2. Replace raw `unzipSync` in:
   - `packages/adapters/{chatgpt,claude,librechat,gemini,doubao,deepseek,lobechat,anythingllm}/src/load-input-bytes.ts`
   - `packages/convert-browser/src/detect.ts`
   - Skip openwebui (no ZIP inflate today).
3. Do **not** change `_archive/mistral`.
4. **TDD:** synthetic tiny zip-bomb (high ratio / many empty entries) rejected; normal fixture ZIPs still convert.

### Done when

- [x] No production `unzipSync(` outside the helper (except tests mocking helper if needed)
- [x] Over-budget ZIP fails with actionable error (entry count / size / ratio)
- [x] Existing adapter convert tests green

---

## Wave 3 — Tar extract budgets (same envelope path as Wave 1)

**Owner:** `/packages-implementer` · **serial after Wave 1** (same `envelope.ts`)

### Tasks

1. Before/during extract: enforce max archive file size; use `tar.extract` `filter` / entry accounting for entry count + uncompressed bytes; refuse path escape even if node-tar already hardens.
2. Before `JSON.parse(data.json)`: enforce max `data.json` size.
3. **TDD:** oversized declared entry or too many entries fails; normal envelopes pass.

### Done when

- [x] Hostile oversized tarball does not fill disk unboundedly (fails within budget)
- [x] Legitimate verify/inspect still works
- [x] `tar-budgets.ts` + envelope wiring (2026-07-22)

### Wave 2b / 3b (Phase V blockers)

- [x] ZIP: account `Math.max(size, originalSize)` for STORED / mismatched headers
- [x] Tar: budget PAX/meta entries (`meta`/`ignoredEntry`); reject symlink/hardlink types

---

## Wave 4 — Browser tar + `storage_name` sanitize

**Owner:** `/packages-implementer` · `tar-gzip.ts` + `pack-bytes.ts` (can parallel Wave 2 if Wave 1 done; **not** parallel with Wave 3 on envelope)

### Tasks

1. Fix `createTarGzip` / `writeString` to be **byte-length** safe; support paths >100 bytes via ustar `prefix` and/or PAX/`GNU` long-name (prefer smallest correct approach that Node `tar` reads).
2. Align `packEnvelopeBytes` with Node `pack.ts`: `basename` + sanitize `storage_name` before tar path and checksum key.
3. Schema: tighten `storage_name` to safe pattern if that does not break existing fixtures (fail fast).
4. **TDD:** attachment path >100 chars + CJK filename → pack bytes → Node `unpackAndVerifyEnvelope` succeeds; checksum keys match on-disk names.

### Done when

- [x] Long / unicode attachment names round-trip browser pack → Node verify
- [x] Short empty-attachment cases still pass
- [x] No header overflow from multi-byte slice bug
- [x] Schema `storage_name` tighten skipped (would break CJK / fixtures)

---

## Wave order & parallelism

**Phase X (2026-07-22):** initial W2‖W4 FAIL on `browser.ts`. Reassignment → **PASS**:

- Wave 4 **drops** `browser.ts` (tar-gzip + pack-bytes only; existing barrel exports).
- Wave 2 sole owner of `browser.ts` + `index.ts` after W1.
- Schema `v1.ts`: prefer one wave; if split, W4 after W1 only.

```text
Wave 1 (envelope confine) ──► Wave 3 (tar budgets on envelope)
                │
Wave 2 (ZIP budgets + browser.ts/index.ts)  ║  Wave 4 (tar-gzip + pack-bytes; no browser.ts)
```

---

## Docs / backlog

- [x] `TODO.md`: mark ZIP bomb budgets row in progress → done when Wave 2 ships
- [ ] One short paragraph in core or CLI help if we surface size limits to users (optional, same PR)

---

## Tests (ship gate)

```bash
bun test
bun run build
```

Phase V: `/verifier` + `/review-bugbot` + `/review-security` (crypto/paths/export parsing).

---

## Explicit non-goals

- Authenticity / trusted-key allowlist (`--expect-key`)
- Adapter content bugs (LibreChat forks, Claude files, attachmentCount honesty) — separate folder
- Spec full rewrite of signature section (unless a one-line “integrity only” clarification is needed in the same PR)
