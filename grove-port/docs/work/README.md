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
  …              ← shipped or superseded
```

## Shipped elsewhere (not in active backlog)

| Project | Notes |
|---------|--------|
| Grove Port foundation | Spec, schema, CLI, ChatGPT adapter — [`archive/2026-06-18-grove-port-foundation/`](./archive/2026-06-18-grove-port-foundation/) |
| Online converter | boske.dev/move — [`archive/2026-06-18-online-converter/`](./archive/2026-06-18-online-converter/) |
| Boske Pulse | Operator HUD — `boske-pulse/` (done) |
| Grove Fit | Hardware fit — `boske-labs/grove-fit/` (in progress) |

## Active

| Folder | Status | Priority |
|--------|--------|----------|
| [`2026-06-19-grove-guard`](./active/2026-06-19-grove-guard/) | **draft — review plan** | P1 — highest impact |
| [`2026-06-19-grove-pack`](./active/2026-06-19-grove-pack/) | **draft — review plan** | P2 — low cost, Labs alignment |
| [`2026-06-19-grove-index`](./active/2026-06-19-grove-index/) | **draft — review plan** | P3 |
| [`2026-06-19-grove-trust`](./active/2026-06-19-grove-trust/) | **draft — review plan** | P4 — research track |

When shipped, `git mv` to `archive/` and note PR or release tag in README.
