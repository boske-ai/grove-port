# Plan — P2 IN adapters + browser parity

**Approved:** 2026-06-21  
**Depends on:** archived [`2026-06-18-p1-adapters`](../../archive/2026-06-18-p1-adapters/)

## Wave 1

1. `packages/adapters/librechat` — flat `messages` + recursive `messagesTree` exports
2. CLI: `convert --from librechat`
3. `@grove-port/convert-browser` — add `mistral` + `librechat`
4. `apps/converter-web` — platform picker + worker
5. Archive shipped folders: foundation, p1-adapters

## Done criteria

- [x] LibreChat fixture + unit tests
- [x] `bun test` green
- [x] CLI `--preview` works for librechat
- [x] Browser converter detects LibreChat + Mistral exports
