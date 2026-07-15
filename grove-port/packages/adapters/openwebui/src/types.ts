export const ADAPTER_ID = 'grove-port-adapter-openwebui' as const;
export const ADAPTER_VERSION = '1.0.0' as const;
export const SOURCE_FORMAT = 'openwebui-export-v1' as const;
export const NO_PARENT: string = '00000000-0000-0000-0000-000000000000';

export interface OpenWebUiMessage {
  id: string;
  parentId: string | null;
  childrenIds: string[];
  role: string;
  content: string;
  model?: string;
  timestamp?: number;
}

export interface OpenWebUiHistory {
  currentId: string;
  messages: Record<string, OpenWebUiMessage>;
}

export interface OpenWebUiChatData {
  title?: string;
  models?: string[];
  history: OpenWebUiHistory;
}

export interface OpenWebUiExportItem {
  chat?: OpenWebUiChatData;
  title?: string;
  models?: string[];
  history?: OpenWebUiHistory;
  created_at?: number | null;
  updated_at?: number | null;
}

export interface GroveConversationRecord {
  conversationId: string;
  title: string;
  user: string;
  endpoint: 'custom';
  createdAt: string;
  updatedAt: string;
  source_format: typeof SOURCE_FORMAT;
  source_fork?: boolean;
  openwebui_models?: string[];
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
  openwebui_message_id: string;
  role: string;
}
