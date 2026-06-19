# Grove Bridge — OUT adapters (prove you’re not a trap)

**Status:** **draft — review `plan.md`**  
**Started:** 2026-06-19

---

## What

MIT toolkit to convert **Grove Port → foreign formats** — Open WebUI JSON, AMP/PAM bundle, LibreChat backup.

```bash
grove-bridge convert workspace.grove-port --to openwebui -o chats.json
```

**IN adapters** bring users to Boske. **Bridge** lets them leave — same open standard, bidirectional trust.

---

## The smart insight

Grove Port’s growth hack is honest migration **in**. Conversion dies if buyers fear lock-in.  
Bridge is the **trust mirror**: “Move in on boske.dev/move, move out with the same spec.”

---

## Real-life use cases

### 1. CTO 30-day evaluation

Tries Boske Cloud. Export `.grove-port` weekly; Bridge → Open WebUI JSON as escape hatch. Higher trial conversion because risk is lower.

### 2. GDPR portability request

Data subject gets Grove Port (signed, complete). DPO also needs legacy Open WebUI dump for contractor still on homelab. One export, two OUT formats.

### 3. Project ends on Boske, continues on Open WebUI

Team pilot on Boske EU Cloud; one workstream stays self-hosted. Bridge exports chat-only lossy preview: “412 threads, 0 agents (not supported in target).”

### 4. Sales answers “what if we leave?”

Send link to Bridge docs + converter. Competitors rarely ship OUT adapters.

→ [`../../ecosystem/use-cases.md`](../../ecosystem/use-cases.md) § Grove Bridge

---

## What already exists

| Asset | Status |
|-------|--------|
| IN adapter mapping (Grove Port, in progress) | Reverse for OUT |
| AMP/PAM prior art | purmemo converters |
| Open WebUI import format | Documented target |

**Depends on:** Grove Port foundation + at least one IN adapter (round-trip tests).

---

## Brand & license

- **Boske Community**
- OSS: MIT CLI + lossy conversion docs per target
- **Paid hook:** Assisted enterprise migration (product); Bridge itself free

---

## Links

- Plan: [`plan.md`](./plan.md)
- Port foundation: [`../2026-06-18-grove-port-foundation/`](../2026-06-18-grove-port-foundation/)

---

## Out of scope (v1)

- Perfect lossless round-trip (document loss per target)
- Real-time sync OUT to vendors
