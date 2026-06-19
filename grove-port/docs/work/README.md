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

## In progress (tracked elsewhere or here)

| Project | Notes |
|---------|--------|
| Grove Port foundation | [`active/2026-06-18-grove-port-foundation/`](./active/2026-06-18-grove-port-foundation/) |
| Online converter | Pairs with Port — [`active/2026-06-18-online-converter/`](./active/2026-06-18-online-converter/) |
| Grove Fit | Hardware fit — `boske-labs/grove-fit/` (separate repo) |

## Done (reference only)

| Project | Notes |
|---------|--------|
| Boske Pulse | Operator HUD — `boske-pulse/` |

## Active — Grove Vault (focus)

| Folder | Status |
|--------|--------|
| [`2026-06-19-grove-vault`](./active/2026-06-19-grove-vault/) | **active focus** — native Mac/Linux, MIT |

**Spec:** [`../spec/vault-handles-v1.md`](../spec/vault-handles-v1.md)

## Other Grove projects (paused)

Guard, Pack, Bridge, Index, Trust, Sign, Stack A — draft plans remain; **Vault first**.

**Docs:** [`vault-and-guard-plain.md`](../ecosystem/vault-and-guard-plain.md) · [`competitive-reality-check.md`](../ecosystem/competitive-reality-check.md)

When shipped, `git mv` to `archive/` and note PR or release tag in README.
