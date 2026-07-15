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
| [`2026-07-15-move-landing-open-repo-boske-import`](./active/2026-07-15-move-landing-open-repo-boske-import/) | **draft — `/move` landing · public repo · Boske import** |
| [`2026-06-22-global-in-adapters`](./active/2026-06-22-global-in-adapters/) | **approved — global IN adapters shipped** |
| [`2026-06-18-online-converter`](./active/2026-06-18-online-converter/) | **pivoted — superseded by move-landing folder** |

## Archived

| Folder | Shipped |
|--------|---------|
| [`2026-06-18-grove-port-foundation`](./archive/2026-06-18-grove-port-foundation/) | 2026-06-18 — schema, CLI, ChatGPT adapter |
| [`2026-06-18-p1-adapters`](./archive/2026-06-18-p1-adapters/) | 2026-06-18 — Claude, Open WebUI adapters (Mistral retired ADR 0001) |
| [`2026-06-21-p2-adapters`](./archive/2026-06-21-p2-adapters/) | 2026-06-21 — LibreChat adapter + browser parity |

When shipped, `git mv` to `archive/` and note PR or release tag in README.
