export const ADAPTER_ID = 'grove-port-adapter-mistral' as const;
export const ADAPTER_VERSION = '1.0.0' as const;
export const SOURCE_FORMAT = 'mistral-vibe-export-v1' as const;
export const NO_PARENT: string = '00000000-0000-0000-0000-000000000000';

export interface MistralContentChunk {
  type: string;
  text?: string;
  referenceIds?: string[];
  imageUrl?: string;
  name?: string;
}

export interface MistralFile {
  type: string;
  name: string;
}

export interface MistralMessage {
  id: string;
  chatId: string;
  role: 'user' | 'assistant' | string;
  content: string;
  contentChunks?: MistralContentChunk[] | null;
  createdAt: string;
  files?: MistralFile[];
}

export type MistralConversation = MistralMessage[];

export interface GroveConversationRecord {
  conversationId: string;
  title: string;
  user: string;
  endpoint: 'mistral';
  createdAt: string;
  updatedAt: string;
  source_format: typeof SOURCE_FORMAT;
  mistral_chat_id?: string;
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
  endpoint: 'mistral';
  createdAt: string;
  mistral_message_id: string;
  role: string;
}
