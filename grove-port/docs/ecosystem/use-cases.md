# Grove ecosystem — real-life use cases

Each Grove project follows the **Grove Port pattern**:

1. **Name a sharp pain** (not “better AI” — a specific failure mode).
2. **Open the contract** (MIT spec + CLI) so trust is auditable.
3. **Free path works offline** (no account, no retention).
4. **Boske is the best place to finish** (import, teams, EU cloud, Enterprise).

---

## The Grove Port pattern (reference)

| Element | Grove Port |
|---------|------------|
| **Pain** | “My AI history is trapped in ChatGPT / Open WebUI.” |
| **Insight** | Migration via **export file**, not live API — zero vendor coupling, GDPR-friendly. |
| **OSS** | Spec + `verify` + IN adapters + boske.dev/move |
| **Trust moment** | Preview counts: “412 chats, 0 files” — honest partial import |
| **Boske hook** | Import → Local / Cloud / teams |

---

## 1. Grove Guard — “My agent sent email to the wrong person”

### Personas

| Who | Story |
|-----|--------|
| **Freelance developer** | Runs Claude + MCP filesystem + email. One prompt typo → agent calls `send_email` with draft to client list. |
| **10-person EU agency** | Boss asks “what did our AI tools access last month?” — no log exists. |
| **IT at SMB** | Wants Copilot-class agents but legal said no until “read-only email MCP.” |

### Real-life flow

```
1. Install grove-guard; point Boske/agent MCP config at localhost:guard
2. policy.yaml: filesystem ✓, email-read ✓, email-send ✗
3. Agent tries send → Guard blocks + writes audit line
4. Manager runs grove-guard audit --since 7d → PDF for compliance
```

### Why it’s smart (like Port)

- **Port** = data leaves vendors as a file. **Guard** = tools never touch the agent without a policy file.
- Competitors target K8s enterprises; we target **self-host + Boske desktop + SMB**.
- Open audit log = EU AI Act “documentation of use” without a SaaS gate.

### Already built?

Partial — Enterprise Work inbox MCP patterns in Boske. Proxy process is net-new OSS.

→ [`boske-extracts.md`](./boske-extracts.md) · [`work/active/2026-06-19-grove-guard/`](../work/active/2026-06-19-grove-guard/)

---

## 2. Grove Pack — “I rebuilt the same ‘research mode’ in three apps”

### Personas

| Who | Story |
|-----|--------|
| **Consultant** | Has a killer research prompt + tool list. Shares with client who uses different AI app. |
| **Team lead** | Wants “meeting notes mode” identical for 8 people — not copy-paste in Slack. |
| **Community contributor** | Publishes `writing-coach` pack on GitHub; Boske users import, others use CLI validate. |

### Real-life flow

```
1. Author writes grove-pack.yaml + README
2. grove-pack validate ./pack.yaml → OK
3. Boske user: Settings → Import pack → tier check (needs Local+)
4. Non-Boske user: still has portable YAML for their own tooling
```

### Why it’s smart

- **Port** moves *history*. **Pack** moves *capability* — same open-format philosophy.
- Open **spec**, proprietary **curated catalog** — PostHog/Langfuse split again.
- Aligns with skills-labs-v1 already in Boske — low extract cost.

### Already built?

Pack loader + YAML shape in Boske Labs (`config/labs/`). Spec + validator = extract.

→ [`work/active/2026-06-19-grove-pack/`](../work/active/2026-06-19-grove-pack/)

---

## 3. Grove Index — “The bot quoted last year’s pricing”

### Personas

| Who | Story |
|-----|--------|
| **Self-host RAG nerd** | Embedded 40k chunks; wiki updated; answers still cite deleted page. |
| **Boske Sources user** | Full re-embed after Notion sync takes 4 hours; skips it; quality drifts. |
| **Ops before demo** | Needs “index health: 12% stale” report Friday morning. |

### Real-life flow

```
1. Sources (or filesystem walker) writes grove-index manifest after embed
2. Nightly cron: grove-index diff manifest vs live files
3. Output: 23 stale docs → ordered re-embed job list (ids only)
4. Boske Cloud: team sees health widget; free CLI works on NAS self-host
```

### Why it’s smart

- **Not another vector DB** — git-for-embeddings manifest any backend can adopt.
- Solves silent failure mode every RAG tutorial ignores.
- Pairs with Stack A Search (fresh web) + Port (move sources with workspace).

### Already built?

Boske Sources embed pipeline — need one export sample to lock manifest fields.

→ [`work/active/2026-06-19-grove-index/`](../work/active/2026-06-19-grove-index/)

---

## 4. Grove Trust — “We can’t load models from the internet”

### Personas

| Who | Story |
|-----|--------|
| **Hospital IT** | Procurement: “Prove this GGUF wasn’t swapped in transit.” |
| **Air-gapped lab** | USB stick with model; offline `grove-trust verify` before llama.cpp load. |
| **Enterprise admin** | Allowlist: only manifests signed by `boske-labs` or internal key. |

### Real-life flow

```
1. Publisher: grove-trust sign model.gguf -o manifest.json
2. User: grove-trust verify model.gguf --manifest manifest.json
3. Boske desktop (optional): block load on failure
4. Enterprise: central registry + audit export
```

### Why it’s smart

- Same trust thread as Port’s `signature.sig` — **verify before trust**.
- Honest threat model: checksum ≠ training provenance, but stops casual tampering.
- EU regulated buyers need *something* auditable today.

### Already built?

Export ed25519 signing; model download checks in desktop — unify via Grove Sign.

→ [`work/active/2026-06-19-grove-trust/`](../work/active/2026-06-19-grove-trust/)

---

## 5. Grove Bridge — “Prove we’re not a trap” (NEW)

### Personas

| Who | Story |
|-----|--------|
| **Evaluator** | CTO tries Boske 30 days; wants Open WebUI export if it fails. |
| **GDPR officer** | Data subject wants data in **vendor-neutral** package *and* legacy Open WebUI JSON. |
| **Self-hoster** | Moves Boske → homelab Open WebUI for one project; keeps chats. |

### Real-life flow

```
1. Export .grove-port from Boske (or receive from colleague)
2. grove-bridge convert --to openwebui -o chats.json
3. Import into Open WebUI — lossy fields documented in preview
4. Marketing: “Move in AND move out — same open standard”
```

### Why it’s smart

- **Port IN** = growth. **Bridge OUT** = conversion (removes lock-in fear).
- Chat-only competitors can’t claim bidirectional workspace portability.
- Reuses IN adapter code paths in reverse.

→ [`work/active/2026-06-19-grove-bridge/`](../work/active/2026-06-19-grove-bridge/)

---

## 6. Grove Sign — one signature stack (NEW)

### Personas

| Who | Story |
|-----|--------|
| **Any Grove publisher** | Same key signs Port exports, model manifests, signed packs. |
| **Third-party integrator** | One library to verify any Grove artifact. |

### Why it’s smart

- DRY across Port, Trust, Pack — community gets one crypto story.
- Extract directly from `export-v1` signing — days not months.

→ [`work/active/2026-06-19-grove-sign/`](../work/active/2026-06-19-grove-sign/)

---

## 7. Grove Vault — keys the agent can use but never know

### The scenario (opaque handles)

You want the agent to **run a command** that needs `GITHUB_TOKEN` or an API key — but:

- **You** should not paste the real key into chat or a visible config
- **The agent** should not see the real key in its context or memory
- **The command** should still run correctly with the real credential at runtime

**Technically possible? Yes** — with **opaque handles**, not “encrypt the key so the agent can decrypt it.”

```
You store once:     grove-vault set github/repo-read --stdin
Agent sees:         vault://github/repo-read   (or {{vault:github/repo-read}})
Vault injects:      real ghp_… only at MCP proxy / child process edge
Transcript shows:   handle only — never plaintext
```

The agent sees a **different thing** (a meaningless handle), not a disguised real key. Wrong handles don't resolve.

→ Technical spec: [`opaque-handles.md`](../work/active/2026-06-19-grove-vault/opaque-handles.md)

### Personas

| Who | Story |
|-----|--------|
| **Developer** | "Deploy to staging via curl" — agent runs it; neither human nor model knows `X-Deploy-Key`. |
| **Paranoid self-hoster** | Won't paste GitHub token into agent config; uses `grove-run --env github -- gh pr merge`. |
| **Small team** | Admin owns secrets; developers' agents use handles they can't read. |

### Real-life flow

```
1. Human (once): grove-vault set deploy/staging --stdin
2. MCP yaml (safe to show agent):
     headers:
       X-Deploy-Key: "{{vault:deploy/staging}}"
3. Agent invokes tool → Vault resolves at wire edge
4. Audit: "resolve deploy/staging" — value never logged
```

### Why it's smart

- **Not obfuscation** — the secret never enters the agent boundary (GitHub Actions / HashiCorp Vault pattern, local-first).
- Lower adoption bar than full Guard — ship Vault first; Guard adds "which handles may resolve."
- Pairs with Guard: block raw `ghp_` / `sk-` in tool args; only `vault://` allowed.

→ [`work/active/2026-06-19-grove-vault/`](../work/active/2026-06-19-grove-vault/)

---

## 8. Stack A Search — private web for RAG (existing backlog)

### Personas

| Who | Story |
|-----|--------|
| **EU self-hoster** | Won’t send queries to Google; needs SearXNG + scrape for Sources. |
| **Boske Cloud prospect** | Tries self-host search stack; upgrades to managed search on Cloud. |

### Already built?

`infra/docker/searxng/` in Boske monorepo — extract runbook + compose.

→ [`work/active/2026-06-19-stack-a-search/`](../work/active/2026-06-19-stack-a-search/)

---

## Priority matrix (community + funnel)

| Project | Real-life sharpness | Funnel | Extract ready? | Ship order |
|---------|---------------------|--------|----------------|------------|
| Grove Guard | Agent sent wrong email | ★★★★ | Partial | **1** |
| Grove Pack | Same mode in 3 apps | ★★★ | Yes | **2** (parallel) |
| Grove Bridge | Not a trap | ★★★★ | After Port adapters | **3** |
| Grove Sign | One verify story | ★★ | Yes | **2** (foundation) |
| Grove Index | Stale pricing answer | ★★★ | Needs sample | **4** |
| Grove Vault | Agent runs command, never knows key | ★★★ | Partial | **P1** (opaque handles) |
| Grove Trust | Unsigned GGUF | ★★ | Partial | **5** |
| Stack A Search | Private web RAG | ★★ | Yes | Opportunistic |

---

## Messaging one-liners (boske.dev)

| Project | Line |
|---------|------|
| Grove Port | Move your whole AI workspace — one file, any tool. |
| Grove Guard | MCP firewall for agents — allow read, deny send. |
| Grove Pack | Share assistant modes like sharing documents. |
| Grove Index | Know when your RAG knowledge is lying. |
| Grove Trust | Verify models before you load them. |
| Grove Bridge | Leave Boske anytime — same open format out. |
| Grove Vault | Keys the agent can use but never know. |

---

*Cross-ref: [`grove-family.md`](./grove-family.md), [`boske-extracts.md`](./boske-extracts.md).*
