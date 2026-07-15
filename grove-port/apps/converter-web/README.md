# converter-web — DEV ONLY

Browser-based Grove Port converter demo. **Not production. Do not ship on boske.dev.**

| Surface | Role |
|---------|------|
| **boske.dev/port** | Marketing landing only — no upload, no embed of this app |
| **Boske app** | Production vendor import (closed) |
| **This package** | Local/dev demo of in-browser convert |

## Local use

```bash
bun run build:web   # from grove-port repo root
```

Optional sync to Boske website `public/move` for **local iframe experiments only** (legacy path name; not the production `/port` route):

```bash
node scripts/sync-converter-to-boske-website.mjs
```

Do **not** run that sync in production deploy pipelines.
