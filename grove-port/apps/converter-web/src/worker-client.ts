import type { BrowserAdapterName, BrowserExportStats, DetectExportResult } from '@grove-port/convert-browser';

type WorkerJobType = 'load' | 'detect' | 'preview' | 'convert' | 'clear';

interface WorkerSuccessMessage {
  id: number;
  ok: true;
  result?: unknown;
}

interface WorkerErrorMessage {
  id: number;
  ok: false;
  error: string;
}

type WorkerResponse = WorkerSuccessMessage | WorkerErrorMessage;

export interface WorkerConvertResult {
  bytes: Uint8Array;
  fileName: string;
  conversationCount: number;
  messageCount: number;
}

export class ConverterWorkerClient {
  private worker!: Worker;
  private nextId = 0;
  private pending = new Map<number, { resolve: (value: unknown) => void; reject: (error: Error) => void }>();

  constructor() {
    this.spawn();
  }

  private spawn(): void {
    this.worker = new Worker(new URL('./converter-worker.ts', import.meta.url), { type: 'module' });
    this.worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
      const message = event.data;
      const handlers = this.pending.get(message.id);
      if (!handlers) {
        return;
      }
      this.pending.delete(message.id);

      if (!message.ok) {
        handlers.reject(new Error(message.error));
        return;
      }

      handlers.resolve(message.result);
    };
    this.worker.onerror = (event) => {
      for (const [, handlers] of this.pending) {
        handlers.reject(new Error(event.message || 'Worker failed'));
      }
      this.pending.clear();
    };
  }

  private call<T>(type: WorkerJobType, payload?: Record<string, unknown>, transfer: Transferable[] = []): Promise<T> {
    const id = ++this.nextId;
    return new Promise<T>((resolve, reject) => {
      this.pending.set(id, {
        resolve: (value) => resolve(value as T),
        reject,
      });
      this.worker.postMessage({ id, type, payload }, transfer);
    });
  }

  loadFile(fileName: string, bytes: Uint8Array): Promise<void> {
    const copy = new Uint8Array(bytes);
    return this.call<void>('load', { fileName, bytes: copy }, [copy.buffer]);
  }

  detect(): Promise<DetectExportResult> {
    return this.call<DetectExportResult>('detect');
  }

  preview(adapter: BrowserAdapterName, userEmail?: string): Promise<BrowserExportStats> {
    return this.call<BrowserExportStats>('preview', { adapter, userEmail });
  }

  convert(adapter: BrowserAdapterName, userEmail?: string): Promise<WorkerConvertResult> {
    return this.call<WorkerConvertResult>('convert', { adapter, userEmail });
  }

  clear(): Promise<void> {
    return this.call<void>('clear');
  }

  /**
   * Rejecting the promises only detaches the caller — the worker keeps grinding
   * on a large conversion. Tear it down and start a fresh one so a cancelled job
   * actually stops burning CPU.
   */
  cancelPending(): void {
    if (this.pending.size === 0) {
      return;
    }

    const cancelled = this.pending;
    this.pending = new Map();

    this.worker.terminate();
    this.spawn();

    for (const [, handlers] of cancelled) {
      handlers.reject(new Error('Cancelled'));
    }
  }

  terminate(): void {
    this.worker.terminate();
    this.pending.clear();
  }
}
