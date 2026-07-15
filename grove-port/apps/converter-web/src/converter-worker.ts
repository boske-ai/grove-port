import {
  convertExportFileToBytes,
  detectExportAdapter,
  previewExportFile,
  type BrowserAdapterName,
} from '@grove-port/convert-browser';

interface CachedFile {
  fileName: string;
  bytes: Uint8Array;
}

interface WorkerRequest {
  id: number;
  type: 'load' | 'detect' | 'preview' | 'convert' | 'clear';
  payload?: {
    fileName?: string;
    bytes?: Uint8Array;
    adapter?: BrowserAdapterName;
    userEmail?: string;
    label?: string;
  };
}

let cachedFile: CachedFile | null = null;

function requireCachedFile(): CachedFile {
  if (!cachedFile) {
    throw new Error('No export loaded in worker.');
  }
  return cachedFile;
}

function formatError(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}

self.onmessage = async (event: MessageEvent<WorkerRequest>) => {
  const { id, type, payload } = event.data;

  try {
    switch (type) {
      case 'load': {
        if (!payload?.fileName || !payload.bytes) {
          throw new Error('Worker load requires fileName and bytes.');
        }
        cachedFile = { fileName: payload.fileName, bytes: payload.bytes };
        self.postMessage({ id, ok: true });
        break;
      }
      case 'detect': {
        const file = requireCachedFile();
        const result = detectExportAdapter(file.fileName, file.bytes);
        self.postMessage({ id, ok: true, result });
        break;
      }
      case 'preview': {
        const file = requireCachedFile();
        if (!payload?.adapter) {
          throw new Error('Preview requires adapter.');
        }
        const stats = await previewExportFile({
          adapter: payload.adapter,
          fileName: file.fileName,
          bytes: file.bytes,
          userEmail: payload.userEmail,
          label: payload.label,
        });
        self.postMessage({ id, ok: true, result: stats });
        break;
      }
      case 'convert': {
        const file = requireCachedFile();
        if (!payload?.adapter) {
          throw new Error('Convert requires adapter.');
        }
        const result = await convertExportFileToBytes({
          adapter: payload.adapter,
          fileName: file.fileName,
          bytes: file.bytes,
          userEmail: payload.userEmail,
          label: payload.label,
        });
        const outbound = new Uint8Array(result.bytes);
        self.postMessage(
          {
            id,
            ok: true,
            result: {
              conversationCount: result.conversationCount,
              messageCount: result.messageCount,
              fileName: `${file.fileName.replace(/\.[^.]+$/, '') || 'export'}.grove-port`,
              bytes: outbound,
            },
          },
          { transfer: [outbound.buffer] },
        );
        break;
      }
      case 'clear': {
        cachedFile = null;
        self.postMessage({ id, ok: true });
        break;
      }
      default:
        throw new Error(`Unknown worker request: ${type}`);
    }
  } catch (error) {
    self.postMessage({ id, ok: false, error: formatError(error) });
  }
};
