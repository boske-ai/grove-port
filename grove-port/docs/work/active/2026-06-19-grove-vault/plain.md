# Grove Vault — plain English

**Start here:** [`../../ecosystem/vault-and-guard-plain.md`](../../ecosystem/vault-and-guard-plain.md)

**Native Mac & Linux:** [`native-platforms.md`](./native-platforms.md)

---

## In one sentence

**Grove Vault is a safe inside Boske** — the agent can use your API keys and SSH keys without ever seeing them.

---

## The problem

To be useful, agents need your GitHub token, OpenAI key, deploy API key, SSH key.

The dangerous habit: paste them into chat or `.env` files the agent can read.

**Vault fixes the "can it see my secrets?" problem.**  
(Guard fixes the separate problem: "what is it allowed to do?")

---

## Real life

| Situation | Old way | With Vault |
|-----------|---------|------------|
| Merge PRs via agent | Paste `ghp_...` in config | Agent sees `vault://github` only |
| Check nginx on server | Share SSH key with agent | Boske runs SSH; key stays in safe |
| `.env` with `sk-...` | Agent can `cat .env` | Keys in Keychain, not in files |
| Rotate deploy token | Edit 6 configs | Rotate once in Vault |

---

## How you use it

1. **You** — Boske Settings → Vault → save secret once (Mac Keychain / Linux keyring)
2. **Agent** — only sees a label: `vault://server-prod`
3. **Boske** — unlocks safe, runs command or API call, gives agent **result only**

The agent never gets the real key — not even a disguised one. Just a name.

---

## Native in the app (Mac + Linux)

Not Docker. Not a separate install. **Part of Boske desktop** on your machine.

Secrets stay local. Works with **Boske Local** and offline models.

Details: [`native-platforms.md`](./native-platforms.md)

---

## With Guard

```
Vault  → hides the key
Guard  → blocks "send email" and asks before "restart server"
```

---

## Links

- Technical: [`opaque-handles.md`](./opaque-handles.md)
- Competitor research: [`../../ecosystem/agent-credential-landscape.md`](../../ecosystem/agent-credential-landscape.md)
- Plan: [`plan.md`](./plan.md)
