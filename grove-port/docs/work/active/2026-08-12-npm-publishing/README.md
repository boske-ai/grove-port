# npm publishing — dual build + release pipeline

**Status:** Approved — build + pipeline done, **not yet published**
**Started:** 2026-08-12

## What

Make `@grove-port/*` consumable by the Boske backend so its forked copy of the
envelope logic can be deleted. That fork drifting is what produced the Aug 2026
import vulnerability; one shared package removes the failure mode.

Three blockers stood in the way, all now cleared:

| Blocker | Resolution |
|---------|------------|
| A git dependency fetches source with no `dist/` (gitignored, no build on install) | Publish to npm instead |
| GitHub Packages needs an auth token to install *even public packages* | Use public npm — no auth, and outsiders can adopt the standard |
| Packages were ESM-only; the Boske backend is CommonJS | Dual ESM + CJS build |

## Not done here

Publishing itself, and the Boske swap. The release workflow is manual and
defaults to `dry_run: true`.

## Links

- Plan: [plan.md](./plan.md)
- Audit that motivated this: [`2026-08-06-audit-remediation`](../2026-08-06-audit-remediation/)
