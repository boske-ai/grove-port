import {
  convertAnythingLlmExportToBytes,
  previewAnythingLlmExport,
  type AnythingLlmExportStats,
} from '@grove-port/adapter-anythingllm/browser';
import {
  convertChatGptExportToBytes,
  previewChatGptExport,
  type ChatGptExportStats,
} from '@grove-port/adapter-chatgpt/browser';
import {
  convertClaudeExportToBytes,
  previewClaudeExport,
  type ClaudeExportStats,
} from '@grove-port/adapter-claude/browser';
import {
  convertDeepSeekExportToBytes,
  previewDeepSeekExport,
  type DeepSeekExportStats,
} from '@grove-port/adapter-deepseek/browser';
import {
  convertDoubaoExportToBytes,
  previewDoubaoExport,
  type DoubaoExportStats,
} from '@grove-port/adapter-doubao/browser';
import {
  convertGeminiExportToBytes,
  previewGeminiExport,
  type GeminiExportStats,
} from '@grove-port/adapter-gemini/browser';
import {
  convertLibreChatExportToBytes,
  previewLibreChatExport,
  type LibreChatExportStats,
} from '@grove-port/adapter-librechat/browser';
import {
  convertLobeChatExportToBytes,
  previewLobeChatExport,
  type LobeChatExportStats,
} from '@grove-port/adapter-lobechat/browser';
import {
  convertOpenWebUiExportToBytes,
  previewOpenWebUiExport,
  type OpenWebUiExportStats,
} from '@grove-port/adapter-openwebui/browser';

export type BrowserAdapterName =
  | 'chatgpt'
  | 'claude'
  | 'openwebui'
  | 'librechat'
  | 'gemini'
  | 'doubao'
  | 'deepseek'
  | 'lobechat'
  | 'anythingllm';

export {
  detectExportAdapter,
  MISTRAL_UNSUPPORTED_MESSAGE,
  type DetectExportResult,
  type DetectionConfidence,
} from './detect.js';

export const BROWSER_ADAPTERS: BrowserAdapterName[] = [
  'chatgpt',
  'claude',
  'openwebui',
  'librechat',
  'gemini',
  'doubao',
  'deepseek',
  'lobechat',
  'anythingllm',
];

export interface BrowserConvertInput {
  adapter: BrowserAdapterName;
  fileName: string;
  bytes: Uint8Array;
  userEmail?: string;
  label?: string;
}

export type BrowserExportStats =
  | ChatGptExportStats
  | ClaudeExportStats
  | OpenWebUiExportStats
  | LibreChatExportStats
  | GeminiExportStats
  | DoubaoExportStats
  | DeepSeekExportStats
  | LobeChatExportStats
  | AnythingLlmExportStats;

export interface BrowserConvertResult {
  bytes: Uint8Array;
  fileName: string;
  conversationCount: number;
  messageCount: number;
  forkedConversations: number;
  attachmentCount: number;
  fileCount: number;
  sourceFormat: string;
  userId: string;
  userEmail: string;
  manifest?: unknown;
}

export async function previewExportFile(
  input: BrowserConvertInput,
): Promise<BrowserExportStats> {
  const options = {
    fileName: input.fileName,
    bytes: input.bytes,
    userEmail: input.userEmail,
    label: input.label,
  };

  switch (input.adapter) {
    case 'chatgpt':
      return previewChatGptExport(options);
    case 'claude':
      return previewClaudeExport(options);
    case 'openwebui':
      return previewOpenWebUiExport(options);
    case 'librechat':
      return previewLibreChatExport(options);
    case 'gemini':
      return previewGeminiExport(options);
    case 'doubao':
      return previewDoubaoExport(options);
    case 'deepseek':
      return previewDeepSeekExport(options);
    case 'lobechat':
      return previewLobeChatExport(options);
    case 'anythingllm':
      return previewAnythingLlmExport(options);
    default: {
      const exhaustive: never = input.adapter;
      throw new Error(`Unsupported adapter: ${exhaustive}`);
    }
  }
}

export async function convertExportFileToBytes(
  input: BrowserConvertInput,
): Promise<BrowserConvertResult> {
  const options = {
    fileName: input.fileName,
    bytes: input.bytes,
    userEmail: input.userEmail,
    label: input.label,
  };

  switch (input.adapter) {
    case 'chatgpt': {
      const result = await convertChatGptExportToBytes(options);
      return mapResult(result, input.fileName);
    }
    case 'claude': {
      const result = await convertClaudeExportToBytes(options);
      return mapResult(result, input.fileName);
    }
    case 'openwebui': {
      const result = await convertOpenWebUiExportToBytes(options);
      return mapResult(result, input.fileName);
    }
    case 'librechat': {
      const result = await convertLibreChatExportToBytes(options);
      return mapResult(result, input.fileName);
    }
    case 'gemini': {
      const result = await convertGeminiExportToBytes(options);
      return mapResult(result, input.fileName);
    }
    case 'doubao': {
      const result = await convertDoubaoExportToBytes(options);
      return mapResult(result, input.fileName);
    }
    case 'deepseek': {
      const result = await convertDeepSeekExportToBytes(options);
      return mapResult(result, input.fileName);
    }
    case 'lobechat': {
      const result = await convertLobeChatExportToBytes(options);
      return mapResult(result, input.fileName);
    }
    case 'anythingllm': {
      const result = await convertAnythingLlmExportToBytes(options);
      return mapResult(result, input.fileName);
    }
    default: {
      const exhaustive: never = input.adapter;
      throw new Error(`Unsupported adapter: ${exhaustive}`);
    }
  }
}

function mapResult(
  result: {
    conversationCount: number;
    messageCount: number;
    forkedConversations: number;
    attachmentCount: number;
    fileCount: number;
    sourceFormat: string;
    userId: string;
    userEmail: string;
    bytes: Uint8Array;
  },
  sourceFileName: string,
): BrowserConvertResult {
  return {
    conversationCount: result.conversationCount,
    messageCount: result.messageCount,
    forkedConversations: result.forkedConversations,
    attachmentCount: result.attachmentCount,
    fileCount: result.fileCount,
    sourceFormat: result.sourceFormat,
    userId: result.userId,
    userEmail: result.userEmail,
    bytes: result.bytes,
    fileName: defaultOutputName(sourceFileName),
  };
}

function defaultOutputName(sourceFileName: string): string {
  const base = sourceFileName.replace(/\.[^.]+$/, '') || 'export';
  return `${base}.grove-port`;
}

export function adapterLabel(adapter: BrowserAdapterName): string {
  switch (adapter) {
    case 'chatgpt':
      return 'ChatGPT';
    case 'claude':
      return 'Claude';
    case 'openwebui':
      return 'Open WebUI';
    case 'librechat':
      return 'LibreChat';
    case 'gemini':
      return 'Gemini';
    case 'doubao':
      return 'Doubao';
    case 'deepseek':
      return 'DeepSeek';
    case 'lobechat':
      return 'LobeChat';
    case 'anythingllm':
      return 'AnythingLLM';
    default: {
      const exhaustive: never = adapter;
      return exhaustive;
    }
  }
}
