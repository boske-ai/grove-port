# Grove Guard — plain English

**Start here:** [`../../ecosystem/vault-and-guard-plain.md`](../../ecosystem/vault-and-guard-plain.md) (Vault + Guard together, simple words)

**Status:** draft — review [`plan.md`](./plan.md)

---

## In one sentence

**Grove Guard is a bouncer for your AI's tools** — it decides what the agent is allowed to do before anything runs.

---

## The problem

Agents can:

- read your email **and** send email
- read files **and** delete files  
- check your server **and** restart production

One confused prompt — or one malicious instruction hidden in a webpage — and the agent does the wrong thing.

**Guard fixes the "what is it allowed to do?" problem.**  
(Vault fixes the separate problem: "can it see my passwords?")

---

## Real life

| Situation | Without Guard | With Guard |
|-----------|---------------|------------|
| "Summarize my inbox" | Agent might hit **Send** | Send blocked — read only |
| "Clean up my project folder" | Might delete wrong directory | Only `~/Projects` allowed |
| "Restart nginx on prod" | Runs immediately | **Popup:** Allow? Yes / No |
| Boss wants March audit | No record | Log: 400 reads, 2 blocked sends |

---

## How you use it

A simple rules file (or Boske Settings toggles):

```yaml
email-read:      allow
email-send:      deny
filesystem:      ~/Documents
server-restart:  ask    # Boske asks you first
```

Everything goes through Guard. Default = **no** unless you said yes.

---

## With Vault (server example)

```
Vault  → hides your SSH key
Guard  → only allows "status" commands; asks before "restart"
Agent  → sees command output, not keys, not unlimited power
```

---

## Built into Boske

Native on **Mac and Linux** — routes MCP tools through Guard before they touch email, files, or servers.

- **Community OSS:** MIT gateway + `policy.yaml` + audit log  
- **Boske Enterprise:** team policies, approval dashboard, export for compliance  

---

## Links

- Full plan: [`plan.md`](./plan.md)
- With Vault: [`../../ecosystem/vault-and-guard-plain.md`](../../ecosystem/vault-and-guard-plain.md)
- Technical ecosystem: [`../../ecosystem/use-cases.md`](../../ecosystem/use-cases.md)
