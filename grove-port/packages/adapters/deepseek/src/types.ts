export const ADAPTER_ID = 'grove-port-adapter-deepseek' as const;
export const ADAPTER_VERSION = '1.0.0' as const;
export const SOURCE_FORMAT = 'deepseek-export-v1' as const;
export const NO_PARENT = '00000000-0000-0000-0000-000000000000';

export type DeepSeekFragmentType = 'REQUEST' | 'RESPONSE' | 'THINK' | 'SEARCH';

export interface DeepSeekFragment {
  type: DeepSeekFragmentType;
  content?: string;
  create_time?: number;
  timestamp?: number | string;
}

export interface DeepSeekMappingNode {
  id: string;
  parent: string | null;
  children?: string[];
  fragment?: DeepSeekFragment;
}

export type DeepSeekMapping = Record<string, DeepSeekMappingNode>;

export interface DeepSeekConversationExport {
  id?: string;
  title?: string;
  mapping: DeepSeekMapping;
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
  deepseek_conversation_id?: string;
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
  endpoint: 'custom';
  createdAt: string;
  deepseek_node_id: string;
  deepseek_fragment_type: DeepSeekFragmentType;
  role: string;
}
