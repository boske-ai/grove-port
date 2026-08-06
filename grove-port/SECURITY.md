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

## Known and accepted: an unpinned signature proves integrity, not authenticity

**This is by design in v1, and we would rather you know it than rediscover it.**

A Grove Port manifest carries the public key that verifies it. Anyone can generate a keypair, sign a package they authored, and that package will pass a plain `grove-port verify`.

So an unpinned v1 signature means: **this package has not been altered since it was signed.** It does **not** mean the package came from any particular person, product, or export.

- `grove-port verify` says so in its output.
- `grove-port inspect` reports `"signature_trust": "self-signed"`.
- The [spec](./spec/v1/README.md#signaturesig) states it normatively.

### Getting proof of origin

Pin the signing key:

```bash
grove-port verify export.grove-port --expect-key <base64-spki>
```

A package signed by any other key is then rejected, and `signature_trust` becomes `trusted-key`. The flag is repeatable so a key rotation can be accepted. The expected key must reach you **out of band** — from the instance that produced the export, never from the package itself.

### Where pinning does and does not help

| Flow | Pinning |
|------|---------|
| Boske instance → Boske instance | **Works.** The receiving instance knows the expected key. This is the intended mode for enterprise migration. |
| Boske → disk → Boske (backup, GDPR export) | **Works**, if the exporting instance records the key it signed with. |
| Vendor export → `convert` → import | **Does not apply.** See below. |

**Adapter-produced packages are effectively unsigned.** `grove-port convert` generates an Ed25519 keypair on the spot, signs, and discards the private key — nothing retains it, so nothing can pin it. The signature on a converted package proves only that the file has not changed since conversion. A converted package is exactly as trustworthy as the vendor export it came from, and no more.

Reports that an unpinned self-signed package verifies are **working as documented** rather than vulnerabilities. Reports that verification can be bypassed *without* a valid signature, that pinning can be defeated, or that a package can affect anything outside its extraction directory, absolutely are.

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
