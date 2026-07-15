export const ADAPTER_ID = 'grove-port-adapter-librechat' as const;
export const ADAPTER_VERSION = '1.0.0' as const;
export const SOURCE_FORMAT = 'librechat-export-v1' as const;
export const NO_PARENT = '00000000-0000-0000-0000-000000000000';

export interface LibreChatContentPart {
  type?: string;
  text?: string | { value?: string };
}

export interface LibreChatMessage {
  messageId: string;
  parentMessageId?: string | null;
  conversationId?: string;
  text?: string;
  content?: LibreChatContentPart[];
  sender?: string;
  isCreatedByUser?: boolean;
  createdAt?: string;
  updatedAt?: string;
  endpoint?: string;
  model?: string;
  error?: boolean;
  unfinished?: boolean;
}

export interface LibreChatMessageTreeNode extends LibreChatMessage {
  children?: LibreChatMessageTreeNode[];
}

export interface LibreChatConversationExport {
  conversationId?: string;
  title?: string;
  endpoint?: string;
  model?: string;
  exportAt?: string;
  branches?: boolean;
  recursive?: boolean;
  messages?: LibreChatMessage[];
  messagesTree?: LibreChatMessageTreeNode[];
}

export interface GroveConversationRecord {
  conversationId: string;
  title: string;
  user: string;
  endpoint: string;
  model?: string;
  createdAt: string;
  updatedAt: string;
  source_format: typeof SOURCE_FORMAT;
  librechat_conversation_id?: string;
  source_fork?: boolean;
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
  endpoint: string;
  createdAt: string;
  librechat_message_id: string;
  role: string;
}
