# Plan — P1 IN adapters

## Wave 1 (this pass)

1. `packages/adapters/claude` — lineage flatten via `current_leaf_message_uuid` + `parent_message_uuid`
2. `packages/adapters/mistral` — per-file message arrays, sort by `createdAt`
3. `packages/adapters/openwebui` — history tree flatten via `currentId` + `parentId`/`childrenIds`
4. CLI: `convert --from claude|mistral|openwebui` + `--preview`
5. Synthetic fixtures + unit tests per adapter

## Done criteria

- [x] Each adapter: `preview*` + `convert*` → verifiable `.grove-port`
- [x] `bun test` green (28 tests)
- [x] CLI `--preview` works for all three

## Follow-up (user exports)

- Validate Claude ZIP when user provides export
- Harden attachments when binary paths are confirmed
