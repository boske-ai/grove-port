import type { BrowserAdapterName } from '@grove-port/convert-browser';

export interface CompatibilityGuide {
  headline: string;
  imports: string[];
  notImported: string[];
  risks: string[];
  steps: string[];
}

export const GENERAL_FLOW: string[] = [
  'Upload your vendor export here — parsing stays in your browser.',
  'We detect the source platform and show an honest preview of what will convert.',
  'Download a signed .grove-port file.',
  'Import it in Boske (Settings → Import) or verify offline with grove-port verify.',
];

export const GLOBAL_RISKS: string[] = [
  'Very large exports can freeze this tab while parsing — prefer desktop CLI for huge archives.',
  'Regeneration forks are flattened to one active thread, so message counts may be lower than the vendor app.',
  'One-click “Import to Boske” from this page is not wired yet — download first, then import in Boske.',
];

export const ADAPTER_COMPATIBILITY: Record<BrowserAdapterName, CompatibilityGuide> = {
  chatgpt: {
    headline: 'ChatGPT → Boske',
    imports: [
      'Conversations and messages',
      'Regeneration forks (keeps latest branch only)',
      'Images and files when included in the export ZIP (.dat assets)',
      'Web citations and browsing snippets as text',
    ],
    notImported: [
      'Custom GPTs / agents',
      'Memories and user profile beyond email',
      'Voice transcript sessions',
      'Shared links and team workspaces',
    ],
    risks: [
      'JSON-only exports skip attachments — re-export as ZIP from ChatGPT Settings for images.',
      'Forked chats import fewer messages than ChatGPT shows in the branch tree.',
    ],
    steps: GENERAL_FLOW,
  },
  claude: {
    headline: 'Claude → Boske',
    imports: [
      'Conversations and messages',
      'Active branch when current_leaf_message_uuid is present',
      'Thinking blocks are stripped; visible text is kept',
    ],
    notImported: [
      'Projects, artifacts, and file attachments (not packed in browser converter yet)',
      'Memories, settings, and billing metadata',
    ],
    risks: [
      'Attachment bytes from Claude exports are not embedded yet — expect text-only import.',
      'Forked conversations keep one lineage, similar to ChatGPT flattening.',
    ],
    steps: GENERAL_FLOW,
  },
  openwebui: {
    headline: 'Open WebUI → Boske',
    imports: [
      'Chats exported as JSON from the Open WebUI UI',
      'Models list and message timestamps',
      'Forked histories via currentId branch selection',
    ],
    notImported: [
      'SQLite database dumps (webui.db) — use JSON export instead',
      'RAG documents, tools, and functions',
      'User accounts and server configuration',
    ],
    risks: [
      'Only JSON exports are supported here — not full database uploads.',
      'Model names are preserved as text; Boske may map them to its own catalog on import.',
    ],
    steps: GENERAL_FLOW,
  },
  librechat: {
    headline: 'LibreChat → Boske',
    imports: [
      'Single-conversation JSON exports from LibreChat Data Controls',
      'Flat messages arrays and recursive messagesTree (first branch)',
      'Endpoint and model metadata when present',
    ],
    notImported: [
      'Attachment files (references only)',
      'Presets, agents, and server configuration',
      'SQLite or Mongo database dumps',
    ],
    risks: [
      'Branching exports keep one active lineage — fork counts may drop.',
      'Tool call and image content is summarized as text markers.',
    ],
    steps: GENERAL_FLOW,
  },
  gemini: {
    headline: 'Google Gemini → Boske',
    imports: [
      'Google Takeout ZIP exports (My Activity → Gemini Apps)',
      'Activity log entries grouped by conversation ID from titleUrl',
      'conversations.json and per-conversation JSON layouts when present',
    ],
    notImported: [
      'Gemini Gems configuration exports',
      'Photos, Drive, or other Google product data from Takeout',
      'Workspace attachments and shared Gems',
    ],
    risks: [
      'Takeout format varies — select Gemini Apps under My Activity, not top-level Gemini Gems.',
      'Activity log timestamps apply per entry, not per message turn.',
    ],
    steps: GENERAL_FLOW,
  },
  doubao: {
    headline: 'Doubao 豆包 → Boske',
    imports: [
      'Official bulk ZIP export (metadata.json + chat_* JSON conversations)',
      'User and assistant messages from conversation JSON files',
      'Session titles from metadata index',
    ],
    notImported: [
      'Uploaded asset files under assets/ (references only)',
      'Plugin call metadata beyond text content',
      'Account settings and billing data',
    ],
    risks: [
      'Very large bulk ZIP exports can be slow in the browser — prefer desktop CLI.',
      'Attachment bytes are not embedded yet — expect text-only import.',
    ],
    steps: GENERAL_FLOW,
  },
  deepseek: {
    headline: 'DeepSeek → Boske',
    imports: [
      'Settings → Privacy/Data export ZIP with conversations.json',
      'REQUEST and RESPONSE fragments flattened to a linear thread',
      'Conversation titles when present',
    ],
    notImported: [
      'THINK and SEARCH fragment blocks (stripped from import)',
      'Browser extension JSON exports (not official v1 path)',
      'Account settings and billing metadata',
    ],
    risks: [
      'Regeneration forks keep one active branch, similar to ChatGPT flattening.',
      'DeepSeek data may be stored in China — review residency before migrating sensitive chats.',
    ],
    steps: GENERAL_FLOW,
  },
  lobechat: {
    headline: 'LobeChat → Boske',
    imports: [
      'Per-session OpenAI-format JSON exports from LobeChat UI',
      'User, assistant, and tool-call messages as text',
      'Topic, model, and session metadata when present',
    ],
    notImported: [
      'Full database or Postgres backup exports',
      'Server presets, plugins, and agent configuration',
      'Image and file attachments',
    ],
    risks: [
      'Tool calls are summarized as text markers — not replayed as live tool invocations.',
      'ZIP uploads with many session files can be slow in the browser tab.',
    ],
    steps: GENERAL_FLOW,
  },
  anythingllm: {
    headline: 'AnythingLLM → Boske',
    imports: [
      'Workspace chat JSON and JSONL exports from Settings → Chats',
      'Prompt/response pairs grouped by workspace and thread',
      'Timestamps from sent_at fields',
    ],
    notImported: [
      'CSV or Alpaca JSON export formats',
      'Vector database documents and embeddings',
      'Workspace configuration and API keys',
    ],
    risks: [
      'Self-hosted instances only — no cloud-hosted AnythingLLM assumptions.',
      'Each log line becomes user + assistant messages; empty prompts or responses are skipped.',
    ],
    steps: GENERAL_FLOW,
  },
};

export function renderCompatibilityGuide(adapter: BrowserAdapterName): string {
  const guide = ADAPTER_COMPATIBILITY[adapter];

  return `
    <section class="guide-block">
      <h3>${guide.headline}</h3>
      <div class="guide-columns">
        <article class="guide-card guide-card-success">
          <h4>Imports to Boske</h4>
          <ul>${guide.imports.map((item) => `<li>${item}</li>`).join('')}</ul>
        </article>
        <article class="guide-card guide-card-muted">
          <h4>Not imported</h4>
          <ul>${guide.notImported.map((item) => `<li>${item}</li>`).join('')}</ul>
        </article>
      </div>
      <article class="guide-card guide-card-warning">
        <h4>Risks & limits</h4>
        <ul>${[...guide.risks, ...GLOBAL_RISKS].map((item) => `<li>${item}</li>`).join('')}</ul>
      </article>
      <article class="guide-card">
        <h4>How it works</h4>
        <ol>${guide.steps.map((item) => `<li>${item}</li>`).join('')}</ol>
      </article>
    </section>
  `;
}
