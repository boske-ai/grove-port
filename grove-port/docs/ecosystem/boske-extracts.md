# Boske → Grove extraction map

What already exists in the Boske monorepo (or siblings) that each Grove project can **reuse** instead of reinventing.

**Rule:** Grove OSS publishes the contract + minimal tooling. Boske product keeps DB mapping, UX polish, and paid layers.

---

## Summary

| Grove project | Already in Boske? | Extract path | Effort |
|---------------|-------------------|--------------|--------|
| **Grove Port** | Yes — core | `export-v1.ts`, `verify-export.js`, Export/Import services | Low |
| **Grove Guard** | Partial — patterns | Enterprise Work inbox MCP, audit patterns | Medium |
| **Grove Pack** | Partial — loader | `config/labs/`, skills-labs-v1 work | Low–medium |
| **Grove Index** | Partial — pipeline | Boske Sources embed jobs, file watchers | Medium |
| **Grove Trust** | Partial — signing | Export signature + model download checks | Medium |
| **Grove Sign** | Yes — crypto | `signature.sig` ed25519 in export-v1 | Low |
| **Grove Bridge** | Partial — inverse | Import adapters logic reversed; AMP/PAM refs | Medium |
| **Grove Vault** | Partial — MCP | Credential scoping in Enterprise MCP | Medium |
| **Stack A Search** | Yes — infra | `infra/docker/searxng/` | Low |
| **Grove Fit** | Yes — logic | `apps/desktop/hardware-fit.js` | Low |

---

## By project

### Grove Port (in progress)

| Asset | Boske path | Notes |
|-------|------------|-------|
| Schema types | `packages/data-provider/src/export-v1.ts` | Wire = `boske-export-v1` |
| Verify CLI | `tools/cli/verify-export.js` | Round-trip CI |
| Export tarball | `apps/backend/server/services/Export/` | Fixture source |
| Import preview | `apps/backend/server/services/Import/` | Counts contract |
| ADR | `docs/decisions/0009-gdpr-and-migration-strategy.md` | Normative |

**Smart reuse:** Same adapters power CLI + boske.dev/move (Web Worker bundle).

---

### Grove Guard

| Asset | Boske path | Notes |
|-------|------------|-------|
| Work inbox MCP | Enterprise feature (unnamed module) | Deny patterns, tool catalog |
| Audit log shape | Likely in MCP middleware | JSONL field names |
| Policy examples | Enterprise config | Sanitize for OSS examples |

**Not in Boske yet:** stdio MCP proxy process — net-new OSS, informed by product patterns.

**Cherry-pick order:** audit event schema → policy deny rules → proxy skeleton.

---

### Grove Pack

| Asset | Boske path | Notes |
|-------|------------|-------|
| Labs pack YAML | `apps/backend/config/labs/` | **Content stays proprietary** — infer schema only |
| Skills/labs v1 | `docs/work/active/2026-06-08-skills-labs-v1/` | Field names, tier gates |
| Pack loader | Backend labs service | Map pack.yaml → runtime |

**Smart reuse:** Spec derived from **shape** of existing YAML, not copying prompts.

---

### Grove Index

| Asset | Boske path | Notes |
|-------|------------|-------|
| Sources pipeline | Boske Sources (RAG) | Embed job metadata |
| File indexing | Sources file watcher | `content_hash` pattern |
| pgvector / FTS | Backend storage | Index does **not** duplicate — manifest only |

**Validation step:** Export one real Sources index state → design manifest fields.

---

### Grove Trust

| Asset | Boske path | Notes |
|-------|------------|-------|
| Export signing | `export-v1` manifest `signature_*` | Same ed25519 stack |
| Model download | Desktop model manager | Checksum before load |
| HF `boske-labs/*` | HuggingFace | Example signed manifests |

**Smart reuse:** Share **Grove Sign** library with Port + Pack catalog signatures.

---

### Grove Sign (shared primitive)

| Asset | Boske path | Notes |
|-------|------------|-------|
| Tarball signature | `export-v1` / `signature.sig` | Tree hash + data.json |
| Key material | Export signing keys | Document keygen for publishers |

One MIT package consumed by Port verify, Trust verify, Pack signed catalog.

---

### Grove Bridge (OUT adapters)

| Asset | Boske path | Notes |
|-------|------------|-------|
| IN adapter mapping | Grove Port adapters (in progress) | Reverse direction |
| AMP/PAM | purmemo converters (prior art) | OUT to `.amp.json` |
| Open WebUI format | Docs + existing import | OUT JSON export |

**Smart reuse:** IN adapter registry becomes bidirectional where formats are lossy-documented.

---

### Grove Vault

| Asset | Boske path | Notes |
|-------|------------|-------|
| MCP credential injection | Enterprise MCP | Scoped tokens, not raw keys |
| Env / keychain | Desktop app | macOS Keychain patterns |

Guard **integrates** Vault; Vault ships standalone for lower adoption bar.

---

### Stack A Search

| Asset | Boske path | Notes |
|-------|------------|-------|
| Docker compose | `infra/docker/searxng/` | Full stack |
| Scrape config | Same tree | EU self-host guide |

Not Grove-branded — Community infra doc repo.

---

### Grove Fit (in progress — Labs)

| Asset | Boske path | Notes |
|-------|------------|-------|
| Tier fit logic | `apps/desktop/hardware-fit.js` | `recommended` / `marginal` / `unavailable` |
| Model tiers | `ABOUT_BOSKE.md` | Seed → Forest mapping |

---

## Extraction workflow

```
1. Identify Boske module → read shapes only (no proprietary copy-paste of content)
2. Publish MIT spec + minimal CLI in Grove repo
3. CI contract test: Boske output ↔ Grove tool output
4. Boske product imports published npm package
```

---

## What we never extract

- Labs pack **prompts** (`config/labs/` content)
- License / lease signing keys
- Production topology, real IPs
- Full Boske ImportService (DB writes stay proprietary)

---

*Update when each extract lands. Cross-ref: [`REFERENCES.md`](../REFERENCES.md), [`use-cases.md`](./use-cases.md).*
