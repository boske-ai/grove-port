# @grove-port/adapter-chatgpt

ChatGPT Settings export → Grove Port v1 IN adapter.

## Supported input

| Input | Notes |
|-------|-------|
| `conversations.json` | Array of conversations (legacy + current) |
| ChatGPT export `.zip` | Reads `conversations.json`, `user.json`, `conversation_asset_file_names.json`, `.dat` assets |

Wire metadata: `source_format: chatgpt-export-v1` · adapter `grove-port-adapter-chatgpt@1.0.0`

## Behaviour

- **Forks:** ChatGPT regeneration branches are flattened to one linear thread; `source_fork: true` on the conversation when siblings were dropped.
- **Images:** Multimodal `asset_pointer` refs are packed into `attachments/` when the export ZIP includes matching `.dat` bytes.
- **Partial fill:** agents, memories, transcript sessions stay empty — expected for ChatGPT imports.

## Message counts vs Boske native import

Boske’s in-app ChatGPT importer keeps **all branches** in the tree. Grove Port **flattens forks** (per foundation plan). Expect fewer messages when a conversation has regeneration forks — e.g. `chatgpt-tree.json` → **6** Grove messages vs **11** in Boske.

Linear exports (e.g. `chatgpt-export.json`) match Boske counts (**19** messages).

## API

```typescript
import { convertChatGptExport, previewChatGptExport } from '@grove-port/adapter-chatgpt';

const preview = await previewChatGptExport({ inputPath: 'export.zip' });
// { conversationCount, messageCount, forkedConversations, fileCount, attachmentCount, ... }

await convertChatGptExport({
  inputPath: 'export.zip',
  outputPath: 'out.grove-port',
});
```

## CLI

```bash
grove-port convert --from chatgpt export.zip -o out.grove-port --preview
grove-port convert --from chatgpt export.zip -o out.grove-port --email you@example.com
```

## Fixtures

Under `fixtures/` — copied from Boske `import/__data__/` plus `chatgpt-2026-parent-only.json` for parent-only mapping graphs.
