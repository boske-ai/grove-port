# External references

Code and docs that Grove Port depends on but does **not** duplicate.

---

## Boske monorepo (implementation source)

| Asset | Path |
|-------|------|
| Export schema (extract from here) | `apps/boske/packages/data-provider/src/export-v1.ts` |
| ADR — GDPR + migration | `apps/boske/docs/decisions/0009-gdpr-and-migration-strategy.md` |
| Export service | `apps/boske/apps/backend/server/services/Export/` |
| Import service | `apps/boske/apps/backend/server/services/Import/` |
| Verify CLI (reference) | `apps/boske/tools/cli/verify-export.js` |
| Product manifest | `apps/boske/MANIFEST.md` |
| Brand / tiers | `apps/boske/ABOUT_BOSKE.md` |

---

## Community / Labs siblings

| Asset | Path |
|-------|------|
| Community hub + INDEX | `apps/boske-community/docs/INDEX.md` |
| Locked decisions | `apps/boske-community/docs/decisions.md` |
| Labs index | `apps/boske-labs/README.md` |
| Pulse OSS plan | `apps/boske-pulse/MANIFEST.md` |
| **Use cases (all Grove projects)** | `grove-port/docs/ecosystem/use-cases.md` |
| **Boske extract map** | `grove-port/docs/ecosystem/boske-extracts.md` |

---

## Boske assets by Grove project

| Grove project | Boske extract | Path |
|---------------|---------------|------|
| Port, Sign | Export schema + signing | `export-v1.ts`, `verify-export.js` |
| Pack | Labs pack shape | `config/labs/`, skills-labs-v1 |
| Index | Sources pipeline | Boske Sources (export sample TBD) |
| Trust | Model verify + signing | Desktop model manager, Grove Sign |
| Guard, Vault | MCP patterns | Enterprise Work inbox MCP |
| Fit | Hardware fit | `apps/desktop/hardware-fit.js` |
| Stack A Search | SearXNG stack | `infra/docker/searxng/` |

Full map: [`docs/ecosystem/boske-extracts.md`](./docs/ecosystem/boske-extracts.md)

---

## Studio

| Asset | Path |
|-------|------|
| Studio architecture | `canopystudio/docs/ARCHITECTURE.md` |
| Studio manifest | `canopystudio/docs/STUDIO_MANIFEST.md` |

---

## Prior art (competitors / partial standards)

| Project | URL | Overlap |
|---------|-----|---------|
| AMP / purmemo | https://github.com/purmemo-ai/purmemo-amp | Chat conversion IN adapter candidate |
| PAM | https://portable-ai-memory.org/ | Memory + conversations |
| Agent Memory Protocol | https://github.com/agentmemoryprotocol/agentmemoryprotocol | Agent memory files |
| Agent File (.af) | https://github.com/letta-ai/agent-file | Single agent |
| ALF | https://github.com/agent-life/agent-life-data-format | Agent state |
| Open WebUI import | https://docs.openwebui.com/features/chat-conversations/data-controls/import-export/ | OUT/IN adapter target |

---

## Planned public URLs

| URL | Purpose |
|-----|---------|
| `github.com/boske-ai/grove-port` | **Live** — repo (**private** until public launch) |
| `boske.dev/move` | Online converter (TBD path) |
| `boske.dev` | Product + Community links |

---

*Update when extract completes or GitHub remote is created.*
