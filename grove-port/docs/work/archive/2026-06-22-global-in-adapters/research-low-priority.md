# Research — Low-priority extraction (Grok, Perplexity, Copilot, Meta AI)

**Status:** Research annex for [`2026-06-22-global-in-adapters`](./README.md)  
**Priority:** P2b — no adapter code until product approves a normalized `source_format`

---

## Summary

| Platform | HQ | Official bulk export | Best extraction path | Grove Port v1 recommendation |
|----------|-----|----------------------|----------------------|------------------------------|
| **Grok** (xAI) | US | No | Browser extension JSON (DOM) | Defer — define `grok-extension-v1` if we adopt ChatArchive schema |
| **Perplexity** | US | PDF per thread only | Extension JSON (`page` or DOM) | Defer — thread-local; poor bulk funnel |
| **Microsoft Copilot** | US | No bulk; per-response Word/PDF | M365 extension JSON+MD; consumer Copilot extension DOM | Defer — two products (M365 vs copilot.microsoft.com) |
| **Meta AI** | US | No | Extension DOM JSON | Defer — consumer/social; weak Boske fit |

---

## Grok (xAI)

**URL:** `grok.com` / X integration

| Method | Tool | Format | Notes |
|--------|------|--------|-------|
| Extension DOM | [ChatArchive](https://github.com/Weiykong/ChatArchive) | JSON, MD, CSV | `dom` extraction; breaks when UI changes |
| Extension | [GrabChat](https://github.com/ShadyGEE/GrabChat) | JSON with `platform`, `messages[]`, timestamps | Structured export schema |
| Extension | [ContextSwitchAI](https://contextswitchai.github.io/ContextSwitchAI/) | CCMF compressed JSON | Cross-platform normalized |

**Blockers for official adapter:** No vendor ZIP/JSON; scraping not allowed in boske.dev/move privacy story.

**If we proceed later:** Import GrabChat/ChatArchive JSON as `grok-extension-v1` — single schema for extension exports across vendors.

---

## Perplexity

**URL:** `perplexity.ai`

| Method | Tool | Format | Notes |
|--------|------|--------|-------|
| Native | Perplexity UI | PDF per thread | Not machine-friendly |
| Extension | ChatArchive | JSON (`page` or `dom`) | Full thread + citations in text |
| Extension | ChatPull | JSON, MD, HTML | Smoke-tested Perplexity in v1.0.0 |

**Unique data:** Search sources / citations embedded in assistant messages — preserve as markdown footnotes in Grove text.

**Blockers:** No account-level export; each thread exported individually.

**If we proceed later:** Accept ChatArchive JSON; map `citations` array to Grove message metadata fields.

---

## Microsoft Copilot

Two distinct surfaces:

### A) Consumer Copilot (`copilot.microsoft.com`)

| Method | Tool | Format | Notes |
|--------|------|--------|-------|
| Per-response | Copilot UI | Word, PDF, plain text | One response at a time — useless for bulk |
| Extension | ChatArchive | JSON via shadow DOM (`page`) | Listed as supported |
| Extension | GrabChat / ContextSwitchAI | JSON | Multi-platform schema |

**No** ChatGPT-style `conversations.json` bulk export ([LLMnesia comparison](https://www.llmnesia.com/blog/how-to-export-microsoft-copilot-conversation-history)).

### B) Microsoft 365 Copilot Chat (work/school)

| Method | Tool | Format | Notes |
|--------|------|--------|-------|
| Extension | [M365-Copilot-Chat-Export](https://github.com/site-speed/M365-Copilot-Chat-Export-extension) | Readable MD + raw JSON `.json.md` | Uses authenticated session + ConversationId |
| API | Substrate endpoints | JSON | Extension-internal; not stable public API |

**Enterprise angle:** Boske on-prem customers may want M365 Copilot export — separate adapter `m365-copilot-extension-v1` if extension JSON schema is documented.

**v1 recommendation:** Document paths; do not implement until a **file-based** contract exists (extension export saved to disk).

---

## Meta AI

**URL:** `meta.ai` / Instagram / Messenger integration

| Method | Tool | Format | Notes |
|--------|------|--------|-------|
| Extension DOM | ChatArchive | JSON | `dom` strategy |
| Extension | GrabChat | JSON | Listed under Meta AI |

**Blockers:** No official export; entertainment/social use case; weak alignment with Boske EU privacy positioning.

**If we proceed later:** Same extension-normalized schema as Grok (`*-extension-v1`).

---

## Unified extension format proposal (future)

If product wants one adapter for all four:

```
packages/adapters/extension-export/
  source_format: chatarchive-json-v1 | grabchat-json-v1
  detect: top-level platform field + messages array
  platforms: grok | perplexity | copilot | meta-ai
```

**Pros:** One parser, many vendors.  
**Cons:** Unstable DOM schemas; not "official export"; support burden when sites change.

**Alternative:** Partner with ChatArchive / document "export with X, then upload JSON" funnel — no live scraping on boske.dev.

---

## Action items (no code)

- [ ] Obtain real fixture files from ChatArchive JSON for each platform (redacted)
- [ ] Product decision: extension-normalized adapter yes/no
- [ ] Separate M365 Copilot from consumer Copilot in marketing copy
- [ ] Add to `TODO.md` P2b only after approval
