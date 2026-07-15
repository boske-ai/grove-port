export const ADAPTER_ID = 'grove-port-adapter-doubao' as const;
export const ADAPTER_VERSION = '1.0.0' as const;
export const SOURCE_FORMAT = 'doubao-export-v1' as const;
export const NO_PARENT = '00000000-0000-0000-0000-000000000000';

export interface DoubaoMetadataSession {
  session_id: string;
  title?: string;
  export_path?: string;
  path?: string;
}

export interface DoubaoMetadata {
  version?: string;
  sessions: DoubaoMetadataSession[];
}

export interface DoubaoMessage {
  role: string;
  content?: string;
  text?: string;
  timestamp?: string;
  created_at?: string;
}

export interface DoubaoConversationExport {
  session_id?: string;
  id?: string;
  title?: string;
  messages: DoubaoMessage[];
}

export interface GroveConversationRecord {
  conversationId: string;
  title: string;
  user: string;
  endpoint: 'custom';
  model: string;
  createdAt: string;
  updatedAt: string;
  source_format: typeof SOURCE_FORMAT;
  doubao_session_id?: string;
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
  doubao_role: string;
  role: string;
}
