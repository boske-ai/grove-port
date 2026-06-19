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

## Active — Grove projects (draft plans)

| Folder | Real-life hook | Priority |
|--------|----------------|----------|
| [`2026-06-19-grove-sign`](./active/2026-06-19-grove-sign/) | One signature stack (extract now) | P1 |
| [`2026-06-19-grove-guard`](./active/2026-06-19-grove-guard/) | Agent emailed wrong person | P1 |
| [`2026-06-19-grove-vault`](./active/2026-06-19-grove-vault/) | Agent runs command, never knows key | **P1** |
| [`2026-06-19-grove-pack`](./active/2026-06-19-grove-pack/) | Same mode in 3 apps | P2 |
| [`2026-06-19-grove-bridge`](./active/2026-06-19-grove-bridge/) | Prove not a trap (OUT adapters) | P2 |
| [`2026-06-19-grove-index`](./active/2026-06-19-grove-index/) | Stale RAG / wrong pricing | P3 |
| [`2026-06-19-grove-trust`](./active/2026-06-19-grove-trust/) | Unsigned GGUF | P4 |
| [`2026-06-19-stack-a-search`](./active/2026-06-19-stack-a-search/) | Private web for RAG | Opportunistic |

**Ecosystem docs:** [`../ecosystem/use-cases.md`](../ecosystem/use-cases.md) · [`../ecosystem/boske-extracts.md`](../ecosystem/boske-extracts.md) · [`../ecosystem/agent-credential-landscape.md`](../ecosystem/agent-credential-landscape.md)

When shipped, `git mv` to `archive/` and note PR or release tag in README.
