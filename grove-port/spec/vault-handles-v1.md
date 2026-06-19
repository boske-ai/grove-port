# Grove Vault — handle spec v1 (draft)

**Status:** Draft — aligns with [`opaque-handles.md`](../docs/work/active/2026-06-19-grove-vault/opaque-handles.md)  
**Version:** 1

---

## Purpose

Define how **opaque handles** reference secrets without exposing plaintext to agents, configs in chat, or logs.

---

## Handle format

```text
vault://<namespace>/<name>     # canonical
{{vault:<namespace>/<name>}}    # substitution in config/env
vlt_<id>                        # optional opaque alias (v1.1)
```

Examples:

- `vault://github`
- `vault://server/prod`
- `vault://deploy/staging`
- `{{vault:openai}}`

**Rules:**

- Namespace and name: `[a-z0-9][a-z0-9._-]{0,63}`
- Handles are **not secrets** — safe in git, chat, audit logs
- Invalid handle → resolve fails fast (no fallback)

---

## Substitution

| Context | Agent / config sees | Runtime sees |
|---------|---------------------|--------------|
| MCP `env` in yaml | `GITHUB_TOKEN: "{{vault:github}}"` | `GITHUB_TOKEN: ghp_…` in **child only** |
| CLI | `grove-run --vault github -- gh pr list` | env in child only |
| Boske export | `{{vault:github}}` preserved | N/A |

**Invariant:** Resolved plaintext exists only in:

1. OS secret store (Keychain / libsecret / encrypted file)
2. Child process memory during command (ephemeral)
3. Never in LLM context, never in parent agent process

---

## Human operations only

| Operation | Who | How |
|-----------|-----|-----|
| `set` | Human | CLI hidden stdin or Boske Settings UI |
| `rotate` | Human | Same |
| `list` | Human or agent | **Names only** — agent may list handles |
| `resolve` | Broker only | Never exposed as agent tool return value |

Agents may **request** actions that cause resolve (e.g. run ssh). They must not receive resolve output as a string.

---

## Secret types (v1)

| Type | Storage | Notes |
|------|---------|-------|
| `api_token` | Keychain / secret service | Bearer, PAT |
| `ssh_private_key` | Keychain / secret service | OpenSSH format |
| `generic` | Same | Password, deploy key, etc. |

Metadata per secret (not secret):

```json
{
  "handle": "vault://server/prod",
  "type": "ssh_private_key",
  "created_at": "2026-06-19T12:00:00Z",
  "rotated_at": null,
  "label": "Production VPS"
}
```

---

## Audit events (local JSONL)

```json
{
  "ts": "2026-06-19T12:00:00Z",
  "event": "resolve",
  "handle": "vault://server/prod",
  "surface": "grove-run",
  "command_hash": "sha256:…",
  "outcome": "ok"
}
```

**Never log:** secret value, partial value, base64 of value.

---

## Threat model (v1)

| Protected | Not protected |
|-----------|---------------|
| Secret in LLM transcript | Malicious same-user process calling broker |
| Secret in committed config | Physical access to unlocked machine |
| Accidental leak in tool output (basic redaction) | Agent tricking human into `grove-vault set` via social engineering |
| Agent reading `.env` if using vault handles | Full shell access if Guard not installed |

---

## Platform backends

| Platform | v1 backend |
|----------|------------|
| macOS | Keychain (`dev.boske.grove-vault`) |
| Linux | libsecret → else `~/.config/grove-vault/secrets.enc` |

See [`native-platforms.md`](../docs/work/active/2026-06-19-grove-vault/native-platforms.md).

---

## Compatibility

- Boske MCP spawn path MUST use this spec for `{{vault:…}}`
- Community `grove-vault` CLI is reference implementation
- Grove Guard (later) may reference handles in policy — out of v1 scope

---

## Changelog

| Date | Change |
|------|--------|
| 2026-06-19 | v1 draft — focus track |
