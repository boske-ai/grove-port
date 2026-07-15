export const ADAPTER_ID = 'grove-port-adapter-gemini' as const;
export const ADAPTER_VERSION = '1.0.0' as const;
export const SOURCE_FORMAT = 'gemini-takeout-v1' as const;
export const NO_PARENT = '00000000-0000-0000-0000-000000000000';

export const GEMS_ONLY_EXPORT_MESSAGE =
  'Select My Activity → Gemini Apps in Google Takeout, not Gemini Gems configuration exports.';

export interface GeminiActivityDetail {
  name?: string;
  value?: string;
}

export interface GeminiActivityEntry {
  header?: string;
  title?: string;
  titleUrl?: string;
  time?: string;
  details?: GeminiActivityDetail[];
  userInteractions?: GeminiActivityDetail[];
}

export interface GeminiConversationMessage {
  role: string;
  content?: string;
  text?: string;
  timestamp?: string;
  createTime?: string;
}

export interface GeminiConversationExport {
  id?: string;
  title?: string;
  messages: GeminiConversationMessage[];
}

export interface GeminiParsedConversation {
  sourceConversationId: string;
  title: string;
  messages: Array<{
    role: 'user' | 'assistant';
    text: string;
    createdAt?: string;
  }>;
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
  gemini_conversation_id?: string;
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
  gemini_role: string;
  role: string;
}
