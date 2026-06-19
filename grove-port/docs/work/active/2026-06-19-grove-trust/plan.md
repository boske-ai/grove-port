# Plan: Grove Trust

**Draft:** 2026-06-19

---

## Goal

Ship a **manifest format + verify CLI** for GGUF (and similar) model files before Boske Enterprise registry.

---

## Phase 1 — Manifest spec

```json
{
  "version": 1,
  "model_id": "boske-labs/forest-q4",
  "files": [
    {
      "path": "model.gguf",
      "sha256": "…",
      "size_bytes": 4294967296
    }
  ],
  "publisher": "boske-labs",
  "signed_at": "2026-06-01T00:00:00Z",
  "signature": "…"
}
```

Document signing algorithm (ed25519 or minisign-compatible).

---

## Phase 2 — CLI

```bash
grove-trust verify ./model.gguf --manifest manifest.json
grove-trust sign ./model.gguf --key ./publisher.key -o manifest.json
grove-trust policy ./allowlist.yaml --check manifest.json
```

Exit codes: 0 = ok, 1 = checksum fail, 2 = signature fail, 3 = policy deny.

---

## Phase 3 — Boske integration (later)

| Task | Owner |
|------|-------|
| Optional verify on model download | Boske desktop |
| Enterprise allowlist UI | Boske product |

---

## Repo layout (planned)

```
boske-labs/grove-trust/
├── spec/v1/
├── packages/cli/
└── examples/sample-manifest/
```

---

## Done criteria

- [ ] Spec + sign/verify round-trip test
- [ ] README with threat model (what this does / does not prove)
- [ ] MIT LICENSE

---

## Risks

| Risk | Mitigation |
|------|------------|
| False sense of security | Threat model doc: checksum ≠ training provenance |
| Signing key management | Document publisher workflow; Enterprise holds org keys |

---

## Build order vs siblings

**Fourth** — compliance credibility, low funnel. Start when Enterprise sales asks or after Pack/Guard.
