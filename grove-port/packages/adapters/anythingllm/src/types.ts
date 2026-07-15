export const ADAPTER_ID = 'grove-port-adapter-anythingllm' as const;
export const ADAPTER_VERSION = '1.0.0' as const;
export const SOURCE_FORMAT = 'anythingllm-export-v1' as const;
export const NO_PARENT = '00000000-0000-0000-0000-000000000000';

export interface AnythingLlmChatLog {
  id: number | string;
  username?: string;
  workspace_name?: string;
  prompt: string;
  response: string;
  sent_at: number | string;
  thread_id?: string | number;
}

export interface AnythingLlmConversation {
  conversationKey: string;
  title: string;
  workspaceName: string;
  logs: AnythingLlmChatLog[];
}

export interface GroveConversationRecord {
  conversationId: string;
  title: string;
  user: string;
  endpoint: 'custom';
  createdAt: string;
  updatedAt: string;
  source_format: typeof SOURCE_FORMAT;
  anythingllm_workspace?: string;
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
  anythingllm_log_id: string | number;
  role: string;
}
