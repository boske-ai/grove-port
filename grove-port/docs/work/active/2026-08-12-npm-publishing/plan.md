# Plan: npm publishing

**Status:** Approved · **Approved:** 2026-08-12

## Goal

`require('@grove-port/core')` works from a CommonJS Node backend, from a package
installed off public npm, with a repeatable release.

## Design

**ESM stays exactly where it is** (`dist/`), CJS is added alongside
(`dist/cjs/`). Existing consumers see no path change — the browser bundle, the
adapters and the CLI are untouched.

- `tsconfig.cjs.json` per package: `module: CommonJS`, `verbatimModuleSyntax: false`
  (it cannot emit CJS), `composite/declaration: false` (types come from the ESM build).
- `scripts/mark-cjs.mjs` writes `dist/cjs/package.json` = `{"type":"commonjs"}`.
  Without it Node reads those files as ESM, because the package is `"type": "module"`.
- `exports` gains a `require` condition. `main` points at CJS so a bare
  `require()` resolves; `module` points at ESM.
- **`core/browser` stays ESM-only** — it is a browser entry point and has no
  CommonJS consumer.

Scope is `schema` + `core`: what Boske's `envelope.js` needs. The rest ship ESM
as before. Same pattern applies if an adapter ever needs CJS.

## workspace:* → ^0.2.0

npm cannot resolve the `workspace:` protocol, so publishing with it produces
packages that fail to install. All 13 internal deps now use `^0.2.0`, which bun
still links locally because the workspace versions match.

## Release

`.github/workflows/grove-port-release.yml`, `workflow_dispatch` only —
npm publishes are effectively permanent, so a release should be deliberate.
Defaults to `dry_run: true`. Publishes in dependency order and asserts both
entry points resolve before uploading.

Needs: `NPM_TOKEN` repo secret, and the `@grove-port` scope owned by that
account (all three names were free on 2026-08-12).

## Done when

- [x] `require('@grove-port/core')` returns the real exports
- [x] ESM root + `/browser` imports still work
- [x] 166 tests, build, typecheck, `build:web` all green
- [x] No `workspace:*` left outside `_archive`
- [ ] Published to npm (manual, deliberate)
- [ ] Boske drops its forked `envelope.js`
