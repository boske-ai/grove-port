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
| `counts` | Preview counts — `conversations`, `messages`, `files`, `presets`, `agents`, `memories`, `tool_calls`, `transcript_sessions`, `workspace_items`, `shares` |
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

Base64 Ed25519 signature over the **canonical serialization of `manifest.json` exactly as written in the package**.

`signature.sig` is **required**. A package without it does not verify.

### Canonical serialization

Deterministic JSON, so signer and verifier agree byte-for-byte:

- Object keys sorted lexicographically; no whitespace.
- `undefined`-valued and function-valued keys omitted (they cannot appear in parsed JSON).
- Arrays keep their order.
- Nesting deeper than **64 levels** MUST be rejected rather than serialized.

Reference: `stableStringify` in [`packages/core/src/canonical.ts`](../../packages/core/src/canonical.ts).

### What the signature covers — and what it does not

`manifest.checksums` covers `data.json`, `README.md`, and every `attachments/<name>`; the manifest carrying those checksums is itself signed. So a valid signature plus matching checksums proves **the whole package is unaltered since signing**.

Verifiers MUST canonicalize the manifest **as parsed from disk**, *before* applying any schema normalization. Canonicalizing a schema-normalized object breaks the format in two ways: keys the schema does not know about fall outside the signature, and any future field default silently invalidates previously-signed packages.

> **Integrity, not authenticity — by default.** `signature_public_key` lives *inside* the manifest it verifies, so anyone can mint a keypair and produce a package that verifies. On its own, a v1 signature is **tamper-evidence only**. Readers MUST NOT present an unpinned signature as proof of origin.

### Key pinning (optional, recommended for instance-to-instance transfer)

A verifier MAY be given a set of public keys trusted to have produced the package. When supplied, it MUST reject a package whose `signature_public_key` is not in that set — even though the package's own signature validates. Comparison SHOULD be over decoded key bytes, so equivalent base64 encodings match.

The order matters: verify the signature **first**, then pin the key. A tampered package must report tampering, not an untrusted key.

Pinning is what turns the signature into proof of origin, and it is the intended mode for instance-to-instance and backup-restore transfers. The expected key must reach the verifier **out of band** — from the instance that produced the export, never from the package itself.

Reference: `grove-port verify --expect-key <base64>` (repeatable, to allow key rotation).

> **Adapter-produced packages cannot be pinned.** An IN adapter converting a vendor export signs with a keypair generated on the spot and immediately discarded — no one retains it, so no verifier can pin it. Those packages are, in practice, **unsigned**: the signature only proves the file has not changed since conversion. Treat converted packages as exactly as trustworthy as the vendor export they came from.

### Unverified members

A member present under the envelope root but absent from `manifest.checksums` is **not** covered by the signature. Packages produced before 2026-08 shipped an unchecksummed `README.md`. Readers MUST treat such members as untrusted content and SHOULD surface them to the user; writers MUST checksum every member they emit.

---

## Envelope layout allowlist

Only these members may appear under the tarball root. Readers MUST reject anything else rather than ignoring it:

`manifest.json` · `data.json` · `signature.sig` · `README.md` · `attachments/`

`attachments/` MUST contain regular files only — no subdirectories, symlinks, or hardlinks. Checksum keys are limited to `data.json`, `README.md`, and `attachments/<basename>`; a key that is absolute, contains a `..` segment, a backslash, or a NUL MUST be rejected before any file is read.

---

## Resource limits (normative)

Hostile packages are cheap to build, so readers MUST fail closed at bounded limits rather than trusting declared sizes. The reference implementation uses:

| Limit | Default |
|-------|---------|
| `.grove-port` file size before extract | 512 MiB |
| tar entries | 20,000 |
| total extracted bytes | 512 MiB |
| `data.json` | 128 MiB |
| `manifest.json` | 4 MiB |
| canonical nesting depth | 64 |

Additionally, for vendor ZIP inputs read by adapters: 10,000 entries, 512 MiB total uncompressed, 256 MiB per entry, and a 100:1 compression-ratio ceiling once the archive is at least 1 MiB.

Symlink and hardlink tar entries MUST be refused. PAX/extended-header records MUST count against the entry and byte budgets. Readers SHOULD stop reading the archive at the first budget refusal rather than draining it.

---

## Import rules (normative for implementers)

1. **Reject** unknown `version`.
2. **Verify** the signature over the raw manifest, then all checksums, before parsing records.
3. **Dry-run preview** before write.
4. **Do not delete source** until import verified + user confirms.
5. **Partial imports allowed** — empty collections are valid.
6. **Never present a valid signature as proof of origin** — see [`signature.sig`](#signaturesig).

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
| 2026-08-06 | Corrected `signature.sig` to describe what the implementation actually signs (canonical manifest, not a hash of `data.json` + attachments); signature documented as required, not optional. Added canonical-serialization rules, the integrity-vs-authenticity warning, the unverified-member rule, the layout allowlist, and normative resource limits. Spelled out `counts` keys. **No wire change** — this documents v1 as shipped. |
