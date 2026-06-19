# Grove Vault — native Mac & Linux (core of Boske)

**Status:** Draft — portability target for v1  
**Platforms:** **macOS** + **Linux** (native, not Docker-only)

Plain English: [`../../ecosystem/vault-and-guard-plain.md`](../../ecosystem/vault-and-guard-plain.md)

---

## Decision

Grove Vault ships **inside Boske desktop** as a native component — not an optional Docker sidecar.

| Layer | What ships |
|-------|------------|
| **Community OSS** | MIT `grove-vault` library + CLI + spec (`vault://` handles) |
| **Boske desktop** | Embeds library — Settings → Vault UI, Keychain integration |
| **Background** | Small local helper (same app bundle / same user session) |

Users on Mac and Linux get the same mental model: **secrets in Boske, labels for the agent, real values never in chat.**

---

## macOS

### Secret storage

| Store | Use |
|-------|-----|
| **Keychain** (primary) | API keys, tokens, SSH private keys |
| Service name | `dev.boske.grove-vault` (or `ai.boske.vault`) |
| Access | Boske app + vault helper only; Touch ID / password for reveal & rotate |

### Process model

```
Boske.app
├── Main UI (chat, settings)
└── Grove Vault helper (XPC or in-process)
         │
         ├── Keychain read/write
         ├── MCP env substitution {{vault:name}}
         └── grove-run child process spawner
```

**v1 preference:** In-process library inside Boske desktop for simplicity; optional XPC helper later for stricter isolation (matches Hermetic-style boundary without separate install).

### User flow

1. Boske → Settings → Vault → **Add secret**
2. Paste or import SSH key / API token (hidden field)
3. Name it: `github`, `server-prod`, `deploy-staging`
4. MCP config dropdown: pick `vault://github` instead of pasting token
5. Agent works; Keychain holds the real value

### macOS-specific wins

- Same trust model users know from 1Password / Safari
- Works offline with Boske Local
- No `.env` on disk with plaintext keys

---

## Linux

### Secret storage

| Store | Priority |
|-------|----------|
| **Secret Service API** (libsecret) | GNOME Keyring, KWallet — preferred when available |
| **Encrypted file fallback** | `~/.config/grove-vault/` encrypted with machine key (age/libsodium) when no keyring |

Detect at runtime: if `org.freedesktop.secrets` available → use it; else encrypted file with user passphrase.

### Process model

Same as macOS — **embedded in Boske desktop** (AppImage / .deb / Flatpak builds).

```
boske-desktop
├── UI
└── grove-vault (linked library)
         ├── libsecret OR ~/.config/grove-vault/
         └── Unix socket for MCP shim (optional)
```

### Parity with Mac

| Feature | macOS | Linux |
|---------|-------|-------|
| Settings → Vault UI | ✓ | ✓ |
| `vault://` in MCP config | ✓ | ✓ |
| Agent never sees plaintext | ✓ | ✓ |
| `grove-run --env` for CLI | ✓ | ✓ |
| Offline / local LLM | ✓ | ✓ |

---

## What is NOT in v1

| Item | Why later |
|------|-----------|
| Windows | After Mac + Linux stable |
| Docker-only vault | Conflicts with “native core” — Docker ok for **server** Boske, desktop uses native |
| Cloud-hosted vault | Boske Enterprise optional sync — not default |
| iOS / Android | Out of scope |

---

## Portable API (one codepath, two backends)

```typescript
// packages/vault — MIT, used by Boske desktop + grove-vault CLI

interface VaultBackend {
  set(name: string, secret: Uint8Array, metadata: SecretMeta): Promise<void>;
  list(): Promise<SecretMeta[]>;           // names only, never values
  resolve(name: string): Promise<Uint8Array>; // broker only — never to LLM context
  delete(name: string): Promise<void>;
  rotate(name: string, secret: Uint8Array): Promise<void>;
}

// macOS: KeychainBackend
// Linux: SecretServiceBackend | EncryptedFileBackend
```

Boske desktop selects backend at startup. Community CLI uses same library.

---

## MCP integration (core app)

When user adds an MCP server in Boske Settings:

```yaml
# What user sees in UI — safe
github:
  env:
    GITHUB_TOKEN: "{{vault:github}}"
```

Boske spawns MCP server with **resolved** env in the child process only. Agent transcript and exported config store `{{vault:github}}` — not the resolved value.

---

## SSH / server management (native)

| Mode | macOS / Linux |
|------|----------------|
| **Wrapped command** | `grove-run --vault server-prod -- ssh user@host "systemctl status nginx"` |
| **MCP tool** | `server_exec(host=prod, command="systemctl status nginx")` — key from vault, output only to agent |

SSH key stored in Keychain / secret service — never written to `~/.ssh` unless user explicitly exports.

---

## Build order (portability)

1. `packages/vault` — interface + Linux encrypted file backend (dev on CI)
2. macOS Keychain backend — Boske desktop dogfood
3. Linux libsecret backend — parity
4. Boske Settings → Vault UI (both platforms)
5. MCP substitution in Boske MCP spawn path
6. Community `grove-vault` CLI for non-Boske users (same library)

---

## Done criteria (native v1)

- [ ] Save/list/delete secret on **macOS** Keychain via Boske Settings
- [ ] Same on **Linux** (libsecret or encrypted fallback)
- [ ] MCP server starts with `{{vault:x}}` resolved in child only
- [ ] Fixture: agent transcript 100 turns — zero `sk-`, `ghp_`, `BEGIN OPENSSH`
- [ ] `grove-vault list` never prints values on either platform

---

*Cross-ref: [opaque-handles.md](./opaque-handles.md) · [landscape](../ecosystem/agent-credential-landscape.md)*
