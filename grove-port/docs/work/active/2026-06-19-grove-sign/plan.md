# Plan: Grove Sign

**Draft:** 2026-06-19

---

## Goal

Extract Boske export signing into standalone MIT package; Port and Trust depend on it.

---

## Phase 1 — Library

```typescript
// packages/sign/src/index.ts
export function signPayload(payload: Uint8Array, privateKey: Uint8Array): Uint8Array;
export function verifyPayload(payload: Uint8Array, signature: Uint8Array, publicKey: Uint8Array): boolean;
export function hashAttachmentTree(paths: string[]): string; // match export-v1
```

Match `export-v1` wire format exactly — CI cross-test with Boske `verify-export.js`.

---

## Phase 2 — CLI

```bash
grove-sign keygen
grove-sign sign-file data.json --key key.pem -o sig.pem
grove-sign verify-file data.json --sig sig.pem --pub pub.pem
```

---

## Phase 3 — Adopt in siblings

| Consumer | Change |
|----------|--------|
| Grove Port CLI | `verify` uses `@grove/sign` |
| Grove Trust | model manifest signatures |
| Grove Pack | optional `signature` field on catalog entries |

---

## Done criteria

- [ ] Round-trip with Boske-generated fixture signature
- [ ] Documented keygen + publisher workflow
- [ ] MIT LICENSE

---

## Build order

**Early** — low effort, unblocks Trust + signed Pack. Can ship in parallel with Pack spec.
