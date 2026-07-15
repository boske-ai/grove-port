# Grove Port v1 — specification (draft)

**Status:** Draft — aligns with Boske `export-v1` / ADR 0009.  
**Public name:** Grove Port v1  
**Wire id:** `boske-export-v1` (compatible until v2)  
**Tarball root:** `boske-export-v1/` or `grove-port-v1/` (same layout)

---

## Purpose

One signed tarball representing **one user's** (or one export job's) AI workspace data for backup, GDPR export, and migration between tools.

---

## Layout

```
*.grove-port/                    # gzip tarball
├── manifest.json
├── data.json
├── attachments/
│   └── <storage_name>           # raw bytes
├── README.md                    # human explainer (not validated)
└── signature.sig                # Ed25519
```

File extension: `.grove-port` or `.boske-export` (alias v1).

---

## manifest.json

| Field | Meaning |
|-------|---------|
| `version` | Literal `"v1"` |
| `label` | User-chosen label |
| `created_at` | ISO-8601 |
| `source` | `app_version`, `deployment`, `tier`, `instance_id` |
| `user_id`, `user_email` | Data subject (GDPR) |
| `counts` | Preview: conversations, messages, files, agents, … |
| `checksums` | path → sha256 hex |
| `signature_alg` | `"ed25519"` |
| `signature_public_key` | base64 |

---

## data.json collections

| Key | Content |
|-----|---------|
| `user` | Owner record (no secrets) |
| `conversations` | Thread metadata |
| `messages` | Message bodies + relations |
| `files` | File metadata |
| `attachments` | Refs linking to `attachments/` bytes |
| `presets` | Saved prompts |
| `agents` | Agent definitions |
| `memories` | Long-term memory entries |
| `tool_calls` | Tool history |
| `transcript_sessions` | Voice / meeting transcripts |
| `shares` | Shared links metadata |

**Invariant:** every record owned by `manifest.user_id`.

Record shapes are validated at import by the **target product**; envelope boundary uses loose records to avoid constant version bumps.

---

## signature.sig

Signs: `sha256(data.json) || sha256-tree(attachments/)`.

Optional for casual user export; **required** for instance-to-instance enterprise migration.

---

## Import rules (normative for implementers)

1. **Reject** unknown `version`.
2. **Verify** all checksums before parsing records.
3. **Dry-run preview** before write.
4. **Do not delete source** until import verified + user confirms.
5. **Partial imports allowed** — empty collections are valid.

---

## Adapter metadata (recommended extension)

Adapters should set in `manifest.source` or `data.json` meta:

```json
{
  "adapter": "grove-port-adapter-chatgpt",
  "adapter_version": "1.0.0",
  "source_format": "chatgpt-export-v1"
}
```

---

## Reference implementation

- Schema (Zod): `packages/schema`
- JSON Schema: `packages/schema/json-schema/manifest.v1.json`, `data.v1.json`
- CLI: `packages/cli` — `grove-port verify`, `grove-port inspect`
- Boske ExportService / ImportService (proprietary)

---

## Changelog

| Date | Change |
|------|--------|
| 2026-06-18 | Initial draft in grove-port repo |
