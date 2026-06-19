# Grove Trust — model provenance verify

**Status:** **draft — review `plan.md`**  
**Started:** 2026-06-19

---

## What

Verify model files before load — checksum, provenance manifest, org allowlist.

```bash
grove-trust verify model.gguf --manifest signed.json
```

- Policy: block load if signature missing (enterprise mode)

---

## Why

| Audience | Pain | Trust fix |
|----------|------|-----------|
| Regulated buyers | GGUF supply chain scares procurement | Signed manifest + verify CLI |
| EU AI Act readiness | Documentation / attestation gaps | Open manifest spec |
| Enterprise IT | No approved model registry for local AI | Allowlist policy file |

---

## Brand & license

- **Boske Labs** (research + compliance credibility)
- OSS: MIT CLI + manifest spec
- **Paid hook:** Boske Enterprise approved model registry + audit export

---

## Dependencies

- Research track — not v1 launch blocker
- Informed by llama.cpp attestation discussions

---

## Links

- Ecosystem: [`../../ecosystem/grove-family.md`](../../ecosystem/grove-family.md) § Grove Trust

---

## Out of scope (v1)

- Hardware attestation / TPM
- Full SBOM for training data
