export const ADAPTER_ID = 'grove-port-adapter-lobechat' as const;
export const ADAPTER_VERSION = '1.0.0' as const;
export const SOURCE_FORMAT = 'lobechat-export-v1' as const;
export const NO_PARENT = '00000000-0000-0000-0000-000000000000';

export interface LobeChatToolCall {
  id?: string;
  type?: string;
  function?: {
    name?: string;
    arguments?: string;
  };
}

export interface LobeChatMessage {
  role: string;
  content?: string | Array<{ type?: string; text?: string }>;
  name?: string;
  tool_calls?: LobeChatToolCall[];
  createdAt?: number | string;
  updatedAt?: number | string;
}

export interface LobeChatSessionExport {
  topic?: string;
  title?: string;
  model?: string;
  sessionId?: string;
  meta?: Record<string, unknown>;
  config?: Record<string, unknown>;
  messages: LobeChatMessage[];
}

export interface GroveConversationRecord {
  conversationId: string;
  title: string;
  user: string;
  endpoint: 'custom';
  model?: string;
  createdAt: string;
  updatedAt: string;
  source_format: typeof SOURCE_FORMAT;
  lobechat_session_id?: string;
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
  endpoint: 'custom';
  createdAt: string;
  lobechat_role: string;
  role: string;
}
