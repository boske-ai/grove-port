# Work folders

Every feature starts here before code. Same discipline as Boske `docs/work/`.

## Structure

```
active/
  <yyyy-mm-dd>-<slug>/
    README.md      ← what, why, status
    plan.md        ← approved plan before code
    checklist.md   ← optional test / ship criteria
archive/
  <yyyy-mm-dd>-<slug>/   ← shipped; note PR or release tag in README
```

## Active

| Folder | Status |
|--------|--------|
| [`2026-08-06-audit-remediation`](./active/2026-08-06-audit-remediation/) | **approved — trust model, adapter hardening, CI** |
| [`2026-07-15-move-landing-open-repo-boske-import`](./active/2026-07-15-move-landing-open-repo-boske-import/) | **draft — `/move` landing · public repo · Boske import** |

## Archived

| Folder | Shipped |
|--------|---------|
| [`2026-06-18-grove-port-foundation`](./archive/2026-06-18-grove-port-foundation/) | 2026-06-18 — schema, CLI, ChatGPT adapter |
| [`2026-06-18-p1-adapters`](./archive/2026-06-18-p1-adapters/) | 2026-06-18 — Claude, Open WebUI adapters (Mistral retired ADR 0001) |
| [`2026-06-18-online-converter`](./archive/2026-06-18-online-converter/) | pivoted — superseded by the move-landing folder |
| [`2026-06-21-p2-adapters`](./archive/2026-06-21-p2-adapters/) | 2026-06-21 — LibreChat adapter + browser parity |
| [`2026-06-22-global-in-adapters`](./archive/2026-06-22-global-in-adapters/) | 2026-06-22 — Gemini, Doubao, DeepSeek, LobeChat, AnythingLLM |
| [`2026-07-22-p0-hardening`](./archive/2026-07-22-p0-hardening/) | 2026-07-22 — verify confine, archive budgets, browser tar ([PR #1](https://github.com/boske-ai/grove-port/pull/1)) |

When shipped, `git mv` to `archive/` and note PR or release tag in README.
