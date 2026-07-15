# Security Policy

## Supported software

This repository publishes **Grove Port** (MIT) under `grove-port/`: schema, core, CLI, and vendor **IN** adapters.

Boske product import/export, cloud, and signing keys for instance envelopes are **out of scope** for this repo.

## Reporting a vulnerability

Please **do not** open a public GitHub issue for security-sensitive reports.

Prefer **GitHub private vulnerability reporting** on [boske-ai/grove-port](https://github.com/boske-ai/grove-port) (Security → Advisories), or contact the Canopy Studio / Boske team via [boske.dev](https://boske.dev), with:

- Description of the issue
- Steps to reproduce
- Affected package / version / commit if known
- Impact assessment (e.g. signature bypass, zip bomb, path traversal)

We aim to acknowledge within a few business days.

## Safe handling of exports

- Never commit real ChatGPT/Claude/etc. user exports or `*.grove-port` files containing personal data.
- Fixtures under `grove-port/packages/adapters/*/fixtures` must remain synthetic.
- Server-side hosts consuming Grove Port adapters should enforce upload size and decompression budgets (zip-bomb hardening is tracked in Grove Port TODO).
