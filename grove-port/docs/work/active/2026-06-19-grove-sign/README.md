# Grove Sign — shared signing primitives

**Status:** **draft — review `plan.md`**  
**Started:** 2026-06-19

---

## What

Small MIT library + CLI for ed25519 signing across the Grove family — Port tarballs, Trust model manifests, signed Pack catalogs.

```bash
grove-sign keygen -o publisher.key
grove-sign sign --manifest manifest.json --key publisher.key
grove-sign verify --manifest manifest.json --sig signature.sig
```

---

## The smart insight

Port, Trust, and Pack each need “verify before trust.” One crypto stack = one community story + **extract from Boske today** (`export-v1` / `signature.sig`).

---

## Real-life use cases

### 1. Publisher signs once

Boske Labs uses same key for model manifests and signed pack catalog entries.

### 2. Integrator verifies any Grove artifact

Third-party tool imports `@grove/sign` — one API for Port + Trust + Pack.

### 3. CI contract tests

Grove Port CI and Grove Trust CI share sign fixtures.

---

## What already exists in Boske

| Asset | Path |
|-------|------|
| Tarball signing | `export-v1` `signature.sig`, tree hash + data.json |
| Key algorithm | `ed25519` in manifest |

→ Extract first — unblocks Trust and Pack signed catalog.

---

## Brand & license

- **Boske Community** (infrastructure)
- OSS: MIT `@grove/sign` + CLI

---

## Links

- Plan: [`plan.md`](./plan.md)
- Consumers: Trust, Port verify, Pack catalog

---

## Out of scope (v1)

- HSM / cloud KMS
- X.509 certificate chains
