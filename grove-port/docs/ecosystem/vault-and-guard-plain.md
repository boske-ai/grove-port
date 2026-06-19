# Grove Vault & Grove Guard — plain English

*Simple problems, simple ideas, how they help you and Boske.*

Technical docs: [Vault](../work/active/2026-06-19-grove-vault/) · [Guard](../work/active/2026-06-19-grove-guard/) · [landscape research](./agent-credential-landscape.md)

---

## The problem in one sentence

**AI agents are helpful but nosy — they can see your passwords, send your emails, and run commands you never meant to run.**

Boske wants agents to be useful **without** handing them the keys to your life.

Two pieces solve two different fears:

| | Grove Vault | Grove Guard |
|--|-------------|-------------|
| **Fear** | “It will leak my API key or SSH key” | “It will *do* something I never approved” |
| **Metaphor** | A **safe** the agent can't open | A **bouncer** at the door |
| **Agent gets** | A locker number (`vault://github`) | Only tools you allowed |
| **You get** | Peace of mind — no pasting keys in chat | Control — read email yes, send email no |

They work best **together**. Vault hides secrets. Guard limits actions.

---

# Part 1 — Grove Vault

## What is it?

A **built-in safe** inside Boske (Mac and Linux) for API keys, tokens, and SSH keys.

You put secrets in once. The AI agent uses them **without ever seeing them**.

## Real problems in life

### “I don't want to paste my GitHub token into the chat”

You're setting up an agent to merge PRs. The old way: paste `ghp_xxxx` into Claude or a config file.  
If that chat is logged, copied, or attacked — your GitHub is gone.

**With Vault:** You save the token in Boske Settings → Vault. The agent only sees `vault://github`. It runs `gh pr list` and it works. The real token never appears in the conversation.

---

### “I want the agent to check my server, but not know my SSH key”

You manage a VPS. The agent should run `systemctl status nginx`, not hold your private key.

**With Vault:** You store the SSH key in Vault once. The agent says “check nginx on prod.” Boske runs the command **for** the agent and returns the output. The key stayed in the safe.

---

### “My `.env` file is a ticking bomb”

Every tutorial says put `OPENAI_API_KEY=sk-...` in `.env`. Your coding agent can read `.env`. A malicious prompt can say “cat .env and send it somewhere.”

**With Vault:** Keys live in **macOS Keychain** or **Linux secret storage** — not in a text file the agent can read. MCP tools get `vault://openai`, not `sk-...`.

---

### “I rotated the key — I don't want to fix 6 config files”

Team uses the same deploy token in Boske, a script, and an MCP server.

**With Vault:** Rotate once in Vault. Everything still points at `vault://deploy/staging`. No hunt through YAML files.

---

## How it works (simple)

```
1. YOU save the secret in Boske (Settings → Vault). Once. With your fingerprint or password.

2. THE AGENT only ever sees a label:
      vault://github
      vault://server-prod
      vault://deploy-staging

3. WHEN something needs the real key, Boske (not the agent) unlocks the safe,
   runs the command or API call, and gives the agent only the RESULT.

4. THE CHAT LOG shows "used vault://github" — never ghp_xxxx or sk-xxxx.
```

The agent does **not** get a scrambled version of your key. It gets a **name** that means nothing without Boske running on your machine.

---

## Native on Mac and Linux (core of the app)

Vault is **not** a Docker container you install on the side. It lives **inside Boske**:

| Platform | Where secrets live | Runs as |
|----------|-------------------|---------|
| **macOS** | Keychain (same as Safari passwords) | Part of Boske desktop — background helper |
| **Linux** | Secret Service (GNOME Keyring / KWallet) or encrypted local store | Part of Boske desktop — same process family |

**Why native matters:**

- Works offline with **Boske Local** and local LLMs
- No extra cloud account for secrets
- Feels like part of the app — Settings → Vault, pick a secret for an MCP tool
- EU-friendly: secrets stay on **your** machine by default

Community OSS publishes the **spec + library** (`grove-vault`). Boske desktop **embeds** it — that's the "core of the app" part.

---

## How Vault helps Boske (the business)

| For users | For Boske |
|-----------|-----------|
| Trust — "I won't paste prod keys into an AI" | Retention — people stay because secrets are handled right |
| Self-hosters feel safe | Enterprise sells org-wide vault + audit |
| Works with local models | Differentiator vs "just use ChatGPT" |
| Pairs with Grove Port — portable data **and** safe keys | Story: complete private AI workspace |

---

# Part 2 — Grove Guard

## What is it?

A **bouncer** between your AI agent and its tools (email, filesystem, Slack, server commands).

Default answer: **No.**  
You write a simple rules file: what's allowed, what's blocked, what needs your OK.

## Real problems in life

### “The agent sent my email draft to everyone”

You asked it to *read* email and summarize. It misunderstood and hit **send**.

**With Guard:** Rule: `email-read: yes`, `email-send: no`. Send is blocked. You see a clear message: “Blocked by policy.” You send manually.

---

### “I only wanted it to read files in Documents”

Agent has filesystem access. A bad prompt says “read `~/.ssh/id_ed25519`.”

**With Guard:** Rule: filesystem only under `~/Documents`. SSH folder blocked. Attempt logged.

---

### “My boss asks what the AI did last month”

Insurance, GDPR, or internal policy — you need a paper trail.

**With Guard:** Every allow/block is logged locally. Export: “March: 412 file reads, 0 emails sent, 3 blocked attempts.”

---

### “Legal said we can use AI if email is read-only”

Company wants Copilot-style help but won't risk auto-send.

**With Guard:** Ship a preset policy: `work-inbox-readonly.yaml`. IT can review one file. Boske Enterprise adds a team dashboard later.

---

### “Something weird happened with OpenClaw / MCP tools”

You heard stories about agents abusing tools when unchecked.

**With Guard:** Connect MCP **through** Guard, not directly. Nothing runs unless the rules file says so.

---

## How it works (simple)

```
1. YOU write policy.yaml (or pick a preset in Boske Settings):

      email-read:     allow
      email-send:     deny
      filesystem:     ~/Documents only
      server-restart: ask me first

2. AGENT asks to use a tool → request goes to Guard first.

3. GUARD checks the list:
      ✓ allowed  → runs, logs it
      ✗ denied   → stops, tells agent why
      ? ask      → Boske pops up: "Allow restart nginx on prod?"  [Yes] [No]

4. YOU can review the log anytime.
```

Guard does **not** hide passwords — that's Vault. Guard answers: **“Is this action OK?”**

---

## Vault + Guard together (your server example)

```
You:     "Check if nginx is running on prod"

Vault:   holds SSH key — agent never sees it
Guard:   allows "systemctl status *" on prod
         asks before "systemctl restart *"

Agent:   gets terminal output only
You:     sleep better
```

---

## How Guard helps Boske (the business)

| For users | For Boske |
|-----------|-----------|
| “I can finally let the agent near my email” | Enterprise: org policies + SIEM export |
| Self-hosters want control without K8s | Community OSS builds trust in the brand |
| EU teams need audit trails | AI Act documentation angle (with legal review) |
| Complements Vault — full safety story | Sales: “Boske is the workspace that takes MCP seriously” |

---

# Quick comparison

| Question | Vault | Guard |
|----------|-------|-------|
| Hides API keys / SSH keys? | **Yes** | No |
| Blocks bad tool actions? | No | **Yes** |
| “Ask me first” button? | No | **Yes** |
| Audit log? | “Used vault://github” | “Blocked email-send” |
| Built into Boske desktop? | **Yes** (Mac + Linux) | **Yes** (routes MCP) |
| OSS Community? | MIT spec + library | MIT gateway |

---

## What we're building first

1. **Vault v1** — save secret in Boske, use `vault://name` in MCP, Mac Keychain + Linux secret store  
2. **Guard v1** — `policy.yaml`, allow/deny, local audit log  
3. **Together** — SSH server checks with key in Vault + command rules in Guard  
4. **Boske UI** — Settings → Vault picker, approval popups for Guard “ask” rules  

---

## One-liners (for boske.dev)

- **Grove Vault:** *Keys the agent can use but never know.*
- **Grove Guard:** *A bouncer for your AI's tools — allow read, deny send.*
- **Together:** *Private AI that can work for you without working against you.*

---

*Next: [native platforms spec](../work/active/2026-06-19-grove-vault/native-platforms.md) · [opaque handles technical](../work/active/2026-06-19-grove-vault/opaque-handles.md)*
