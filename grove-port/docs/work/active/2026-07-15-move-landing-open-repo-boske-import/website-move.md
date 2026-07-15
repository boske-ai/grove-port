# Website — `/port` landing (no conversion)

> **Production URL:** `/port` on boske.dev (not `/move`).

Replace the current converter embed with a **marketing + routing** page.

**Implement in:** Boske website repo (route: `/port`).  
**Grove Port role:** content source of truth + retire `apps/converter-web` from production sync.

---

## Page job

Educate → CTA to Boske. **Never** upload or process exports on boske.dev.

---

## Content outline

### 1. Hero

- **Brand:** Grove Port / Move to Boske (hero-level product name)
- **Headline:** Move your AI workspace to Boske  
- **Support:** Export from ChatGPT, Claude, and other tools. Import securely **inside Boske** — boske.dev never receives your export files.
- **Primary CTA:** Open Boske → Import workspace (or Download Boske Local)
- **Secondary CTA:** Read the open spec (GitHub)

### 2. How it works (3 steps)

1. **Export** from your current tool (per-platform links).
2. **Import in Boske** — app detects format and shows preview counts.
3. **Work in Boske** — team, EU cloud, RAG (light upsell; one sentence).

### 3. Supported sources table

| Platform | What to export | Import in Boske | Open CLI |
|----------|----------------|-----------------|----------|
| ChatGPT | Settings → Export ZIP (incl. sharded `conversations-*.json`) | Yes | Yes |
| Claude | Privacy export ZIP | Yes | Yes |
| Open WebUI | JSON export | Yes | Yes |
| LibreChat | JSON export | Yes | Yes |
| Google Gemini | Takeout → Gemini Apps | Yes | Yes |
| Doubao | Bulk ZIP | Yes | Yes |
| DeepSeek | Export Data ZIP / JSON | Yes | Yes |
| LobeChat | OpenAI-format JSON | Yes | Yes |
| AnythingLLM | JSON / JSONL | Yes | Yes |
| Mistral Le Chat | — | No | No |

Link Mistral row to ADR 0001 when public.

### 4. Privacy block

- boske.dev does **not** upload or store chat exports.
- Conversion runs in **Boske** (Local or your Cloud region) under the Data Promise / privacy policy.
- Grove Port is an open format — verify packages offline with the CLI.

### 5. Developers / skeptics

- Link: GitHub repo + `grove-port verify`
- One line: “Build your own importer — MIT format.”

### 6. Large exports / CLI

> Exports over ~200 MB, automation, or air-gapped machines: use **`grove-port convert`** locally, then import the `.grove-port` in Boske (or keep it as a portable backup).

---

## Retire from production

| Current | Action |
|---------|--------|
| `converter-web` iframe / static embed | Remove from production `/port` (and any legacy `/move`) |
| Sync script to `public/move` | Stop for production; optional keep for local demos only |
| Upload → Worker → download UX | Do not ship on marketing site |

Optional: keep `apps/converter-web` in grove-port as **dev demo** behind a README note (“not production”).

---

## i18n / SEO (same PR or follow-up)

- FR / NL / DE strings for landing (not converter UI)
- SEO: “import ChatGPT to Boske”, “ChatGPT export to Boske”, “portable AI workspace”

---

## Acceptance

- [ ] No file input on production `/port`
- [ ] Privacy sentence accurate
- [ ] CTAs point to Boske (and GitHub)
- [ ] Supported table matches shipped adapters
