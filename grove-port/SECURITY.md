# Security Policy

Grove Port's whole point is that you can check your own data without trusting us. Security reports are therefore treated as first-class bugs.

---

## Reporting a vulnerability

**Do not open a public issue for a vulnerability.**

Use GitHub's private reporting: **[Report a vulnerability](https://github.com/boske-ai/grove-port/security/advisories/new)** (Security → Advisories → Report a vulnerability).

Please include:

- What an attacker can do, and what they need to start (a crafted `.grove-port`? a vendor export the victim uploads?)
- Affected package(s) and version or commit
- A minimal reproduction — a small crafted file plus the command you ran is ideal

**Response targets:** acknowledgement within 3 working days; an assessment with a fix plan or a reasoned decline within 10 working days.

We will credit you in the advisory unless you ask us not to.

---

## Scope

In scope — the MIT code in this repo:

| Area | Examples |
|------|----------|
| `packages/core` | Envelope verify/unpack, signature and checksum handling, archive budgets, path confinement |
| `packages/schema` | Validation gaps that let a malformed package through |
| `packages/adapters/*` | A crafted vendor export causing memory exhaustion, unbounded CPU, path escape, or a crash |
| `packages/cli` | Anything `grove-port verify` / `inspect` / `convert` does with a hostile file |
| `apps/converter-web` | The in-browser converter demo |

Out of scope: the Boske product (proprietary — report via [boske.dev](https://boske.dev)), `packages/adapters/_archive/**` (retired, not built or published), and findings that require an attacker who already controls the machine.

---

## Known and accepted: signatures prove integrity, not authenticity

**This is by design in v1, and we would rather you know it than rediscover it.**

A Grove Port manifest carries the public key that verifies it. Anyone can generate a keypair, sign a package they authored, and that package will pass `grove-port verify`.

So a valid v1 signature means: **this package has not been altered since it was signed.** It does **not** mean the package came from any particular person, product, or export.

- `grove-port verify` says so in its output.
- `grove-port inspect` reports `"signature_trust": "self-signed"`.
- The [spec](./spec/v1/README.md#signaturesig) states it normatively.

Treat a package the way you'd treat any file from its source. A trusted-key allowlist (`--expect-key`) is planned; until it ships, reports that a self-signed package verifies are **working as documented** rather than vulnerabilities. Reports that verification can be bypassed *without* a valid signature, or that a package can affect anything outside its extraction directory, absolutely are.

---

## Hardening already in place

Verify and adapter inputs are treated as hostile. Current defenses, all covered by tests:

- **Path confinement** — checksum keys and tar entries rejected for absolute paths, `..` segments, backslashes, NULs; symlinks and hardlinks refused; realpath re-checked against the envelope root before any read.
- **Archive budgets** — bounded archive size, entry count, extracted bytes, `data.json` and `manifest.json` size; ZIP entry/size/ratio ceilings; PAX headers counted; extraction stops at the first refusal.
- **Signature scope** — verification runs over the raw manifest bytes as written, so unknown keys cannot ride along unsigned and schema changes cannot silently invalidate old packages.
- **Bounded traversal** — every conversation-graph walk terminates on cyclic input and runs in linear time.

Limits are listed in [`spec/v1/README.md`](./spec/v1/README.md#resource-limits-normative).

---

## Privacy

The CLI is fully offline and the browser converter processes files locally — there is no network egress anywhere in this repo. If you find code here that transmits user data, that is a security bug; please report it.
