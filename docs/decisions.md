# Locked decisions — Boske Community / Grove (2026-06-18)

Immutable unless superseded by a new dated entry. Extract to ADR in Boske monorepo if product-impacting.

---

## D1 — Grove Port is Community, not Labs

**Grove Port** (spec, CLI, adapters, converter) ships under **Boske Community**, MIT.

Boske Labs owns R&D extracts (Grove Fit, Grove Trust, pack spec, model weights).

---

## D2 — Base layer + adapters

One canonical **Grove Port v1** tarball. **IN adapters** per vendor; **OUT adapters** optional. **Boske native** maps Grove ↔ DB (proprietary).

Grove Port core does **not** encode Postgres/SQLite/Mongo.

---

## D3 — Migration without API coupling

Primary motion: **export file → import** — not permanent sync between ChatGPT, Open WebUI, and Boske.

Adapters are the **sales funnel** from other platforms.

---

## D4 — v1 wire compatibility

Public name **Grove Port v1**; wire format **compatible with** Boske `boske-export-v1` until an explicit v2.

---

## D5 — Online converter privacy

**boske.dev/move** (URL TBD): prefer **in-browser** conversion; **zero retention** if server-side; download without account.

---

## D6 — Folder layout

Community hub: `canopystudio/apps/boske-community/`  
First project: `grove-port/`  
Labs index: `canopystudio/apps/boske-labs/`  
Pulse stays sibling: `canopystudio/apps/boske-pulse/`

Git repo root: **`boske-community/`** (includes hub + grove-port).

---

## D7 — Pulse is Community OSS (planned)

**Boske Pulse** → MIT under Boske Community after config sanitization. Not Labs. Not in customer SKU. Not Grove-branded (separate product name).

---

## D8 — Partial adapter fills

IN adapters may leave collections empty. Import **must** preview counts and not imply full workspace when only chats were converted.

---

## D9 — What we do not open-source

Boske product monorepo, Labs pack **content**, license signing, cloud proxy secrets, production topology with real IPs.

---

## D10 — GitHub naming

First remote: **`boske-ai/grove-port`** — **private until launch**, then public MIT.

---

## D11 — Build priority (updated 2026-06-19)

**In progress:** Grove Port, online converter, Grove Fit.

**Done (reference only):** Boske Pulse.

## D12 — Grove Vault focus (2026-06-19)

**Active Grove track:** Grove Vault — native secret safe in Boske (Mac + Linux).

Grove Guard and other Grove siblings remain drafted; not parallel priority until Vault v1 ships in Boske.

Spec: `grove-port/spec/vault-handles-v1.md` · Work: `docs/work/active/2026-06-19-grove-vault/`

---

*Do not edit landed decisions; append new dated blocks if changed.*
