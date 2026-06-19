# Grove Trust — model provenance verify

**Status:** **draft — review `plan.md`**  
**Started:** 2026-06-19

---

## What

Verify model files before load — checksum, provenance manifest, org allowlist.

```bash
grove-trust verify model.gguf --manifest signed.json
```

---

## The smart insight

**Grove Port** signs workspace exports so you trust **exit**.  
**Grove Trust** signs model files so you trust **entry** — verify before `llama.cpp` loads, like `npm audit` for GGUF.

---

## Real-life use cases

### 1. Hospital procurement

IT requires signed manifest for any on-prem model. USB delivery → air-gapped `grove-trust verify` → load or reject.

### 2. “Did someone swap the download?”

Developer pulled GGUF from mirror. Checksum mismatch → Trust blocks load in Boske desktop (optional hook).

### 3. Enterprise allowlist

`policy.yaml`: only publishers `boske-labs`, `internal-security`. Unsigned community models blocked in enterprise mode.

### 4. EU AI Act documentation

Not legal advice — but auditable “we verified checksum + signature at load time” log export for Enterprise.

→ Full scenarios: [`../../ecosystem/use-cases.md`](../../ecosystem/use-cases.md) § Grove Trust

---

## What already exists in Boske

| Asset | Status |
|-------|--------|
| `export-v1` ed25519 signing | Reuse via **Grove Sign** |
| Desktop model download checks | Inform verify hook |
| HF `boske-labs/*` | Example signed manifests |

→ [`../../ecosystem/boske-extracts.md`](../../ecosystem/boske-extracts.md)

---

## Brand & license

- **Boske Labs**
- OSS: MIT CLI + manifest spec
- **Paid hook:** Enterprise approved model registry + audit export

---

## Links

- Plan: [`plan.md`](./plan.md)
- Depends on: [`../2026-06-19-grove-sign/`](../2026-06-19-grove-sign/) (shared crypto)
- Use cases: [`../../ecosystem/use-cases.md`](../../ecosystem/use-cases.md)

---

## Out of scope (v1)

- Hardware attestation / TPM
- Full SBOM for training data
