import { convertAnythingLlmExport, previewAnythingLlmExport } from '@grove-port/adapter-anythingllm';
import { convertChatGptExport, previewChatGptExport } from '@grove-port/adapter-chatgpt';
import { convertClaudeExport, previewClaudeExport } from '@grove-port/adapter-claude';
import { convertDeepSeekExport, previewDeepSeekExport } from '@grove-port/adapter-deepseek';
import { convertDoubaoExport, previewDoubaoExport } from '@grove-port/adapter-doubao';
import { convertGeminiExport, previewGeminiExport } from '@grove-port/adapter-gemini';
import { convertLibreChatExport, previewLibreChatExport } from '@grove-port/adapter-librechat';
import { convertLobeChatExport, previewLobeChatExport } from '@grove-port/adapter-lobechat';
import { convertOpenWebUiExport, previewOpenWebUiExport } from '@grove-port/adapter-openwebui';

export interface ConvertAdapterOptions {
  inputPath: string;
  outputPath?: string;
  userEmail?: string;
  label?: string;
}

export interface ConvertAdapterStats {
  conversationCount: number;
  messageCount: number;
  forkedConversations: number;
  attachmentCount: number;
  fileCount: number;
  sourceFormat: string;
  userId: string;
  userEmail: string;
}

export interface ConvertAdapterResult extends ConvertAdapterStats {
  outputPath: string;
}

const ADAPTERS = {
  chatgpt: {
    preview: previewChatGptExport,
    convert: convertChatGptExport,
  },
  claude: {
    preview: previewClaudeExport,
    convert: convertClaudeExport,
  },
  openwebui: {
    preview: previewOpenWebUiExport,
    convert: convertOpenWebUiExport,
  },
  librechat: {
    preview: previewLibreChatExport,
    convert: convertLibreChatExport,
  },
  gemini: {
    preview: previewGeminiExport,
    convert: convertGeminiExport,
  },
  doubao: {
    preview: previewDoubaoExport,
    convert: convertDoubaoExport,
  },
  deepseek: {
    preview: previewDeepSeekExport,
    convert: convertDeepSeekExport,
  },
  lobechat: {
    preview: previewLobeChatExport,
    convert: convertLobeChatExport,
  },
  anythingllm: {
    preview: previewAnythingLlmExport,
    convert: convertAnythingLlmExport,
  },
} as const;

export type ConvertAdapterName = keyof typeof ADAPTERS;

export function isConvertAdapterName(value: string): value is ConvertAdapterName {
  return value in ADAPTERS;
}

export async function previewAdapterExport(
  from: ConvertAdapterName,
  options: ConvertAdapterOptions,
): Promise<ConvertAdapterStats> {
  return ADAPTERS[from].preview(options);
}

export async function convertAdapterExport(
  from: ConvertAdapterName,
  options: ConvertAdapterOptions & { outputPath: string },
): Promise<ConvertAdapterResult> {
  return ADAPTERS[from].convert(options);
}

export const SUPPORTED_CONVERT_ADAPTERS = Object.keys(ADAPTERS) as ConvertAdapterName[];
