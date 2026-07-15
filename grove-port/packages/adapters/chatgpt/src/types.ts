export const ADAPTER_ID = 'grove-port-adapter-chatgpt' as const;
export const ADAPTER_VERSION = '1.0.0' as const;
export const SOURCE_FORMAT = 'chatgpt-export-v1' as const;
export const NO_PARENT: string = '00000000-0000-0000-0000-000000000000';

export interface ChatGptAuthor {
  role: string;
  name: string | null;
  metadata: Record<string, unknown>;
}

export interface ChatGptContent {
  content_type: string;
  parts?: unknown[];
  language?: string;
  text?: string;
  result?: string;
}

export interface ChatGptMessage {
  id: string;
  author: ChatGptAuthor;
  create_time: number | null;
  update_time: number | null;
  content: ChatGptContent;
  status?: string;
  metadata?: {
    citations?: ChatGptCitation[];
    model_slug?: string;
    [key: string]: unknown;
  };
}

export interface ChatGptCitation {
  start_ix?: number;
  end_ix?: number;
  metadata?: {
    type?: string;
    title?: string;
    url?: string;
  };
}

export interface ChatGptMappingNode {
  id: string;
  message: ChatGptMessage | null;
  parent: string | null;
  children?: string[];
}

export type ChatGptMapping = Record<string, ChatGptMappingNode>;

export interface ChatGptConversation {
  title: string;
  create_time: number;
  update_time?: number;
  mapping: ChatGptMapping;
  conversation_id?: string;
  id?: string;
}

export interface GroveConversationRecord {
  conversationId: string;
  title: string;
  user: string;
  endpoint: 'openAI';
  createdAt: string;
  updatedAt: string;
  source_format: typeof SOURCE_FORMAT;
  source_fork?: boolean;
  chatgpt_conversation_id?: string;
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
  endpoint: 'openAI';
  createdAt: string;
  chatgpt_message_id: string;
  role: string;
  content_type: string;
}
