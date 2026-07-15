# Contributing to Boske Community / Grove Port

Thanks for interest in **Grove Port** — the open MIT standard for portable AI workspaces.

**User funnel:** [boske.dev/port](https://boske.dev/port) (landing) → Boske import (closed) → optional CLI. This repo does **not** host production upload/convert.

## Repo layout

This GitHub repository root is **Boske Community**. Grove Port lives in [`grove-port/`](./grove-port/):

```bash
cd grove-port
bun install
bun run build
bun test
```

CLI (after build):

```bash
bun run grove-port -- verify path/to/file.grove-port
bun run grove-port -- convert --from chatgpt path/to/export.zip -o out.grove-port
```

## What belongs here (MIT)

- Spec, schema, core pack/verify, CLI, IN adapters, convert-browser, fixtures, docs

## What does **not** belong here

- Boske product app, import wizard, DB mappers, cloud/SSO, secrets, real user export ZIPs
- See [`grove-port/docs/work/active/2026-07-15-move-landing-open-repo-boske-import/open-vs-closed.md`](./grove-port/docs/work/active/2026-07-15-move-landing-open-repo-boske-import/open-vs-closed.md)

## Pull requests

1. Keep PRs small and focused.
2. Add or update tests with behavior changes.
3. Do not commit `.env`, credentials, or `*.grove-port` / real export fixtures.
4. Mistral Le Chat support is intentionally retired ([ADR 0001](./grove-port/docs/decisions/0001-no-mistral-support.md)).

## Code of conduct

Be respectful. Security issues: see [SECURITY.md](./SECURITY.md).
