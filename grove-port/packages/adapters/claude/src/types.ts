export const ADAPTER_ID = 'grove-port-adapter-claude' as const;
export const ADAPTER_VERSION = '1.0.0' as const;
export const SOURCE_FORMAT = 'claude-export-v1' as const;
export const NO_PARENT: string = '00000000-0000-0000-0000-000000000000';

export interface ClaudeContentBlock {
  type: string;
  text?: string;
  thinking?: string;
  name?: string;
  input?: Record<string, unknown>;
  content?: unknown;
}

export interface ClaudeMessage {
  uuid: string;
  sender: string;
  created_at: string;
  updated_at?: string;
  text?: string;
  content?: ClaudeContentBlock[];
  parent_message_uuid?: string | null;
  attachments?: unknown[];
  files?: unknown[];
}

export interface ClaudeConversation {
  uuid: string;
  name: string;
  created_at: string;
  updated_at: string;
  chat_messages: ClaudeMessage[];
  model?: string;
  current_leaf_message_uuid?: string | null;
  summary?: string;
}

export interface ClaudeExportUser {
  uuid?: string;
  email_address?: string;
  full_name?: string;
}

export interface GroveConversationRecord {
  conversationId: string;
  title: string;
  user: string;
  endpoint: 'anthropic';
  createdAt: string;
  updatedAt: string;
  source_format: typeof SOURCE_FORMAT;
  source_fork?: boolean;
  claude_conversation_uuid?: string;
  model?: string;
}

export interface GroveMessageRecord {
  messageId: string;
  conversationId: string;
  parentMessageId: string;
  user: string;
  text: string;
  sender: string;
  isCreatedByUser: boolean;
  model: string;
  endpoint: 'anthropic';
  createdAt: string;
  claude_message_uuid: string;
  role: string;
}
