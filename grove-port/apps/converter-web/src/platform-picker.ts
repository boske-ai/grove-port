import {
  adapterLabel,
  BROWSER_ADAPTERS,
  type BrowserAdapterName,
  type BrowserExportStats,
  type DetectExportResult,
} from '@grove-port/convert-browser';

export const PLATFORM_META: Record<
  BrowserAdapterName,
  { short: string; formats: string; accent: string }
> = {
  chatgpt: { short: 'GPT', formats: 'JSON · ZIP', accent: '#10a37f' },
  claude: { short: 'CL', formats: 'JSON · ZIP', accent: '#d97757' },
  openwebui: { short: 'OW', formats: 'JSON', accent: '#2563eb' },
  librechat: { short: 'LC', formats: 'JSON · ZIP', accent: '#6366f1' },
  gemini: { short: 'GM', formats: 'ZIP', accent: '#4285f4' },
  doubao: { short: 'DB', formats: 'ZIP', accent: '#ff6a00' },
  deepseek: { short: 'DS', formats: 'JSON · ZIP', accent: '#4d6bfe' },
  lobechat: { short: 'LB', formats: 'JSON · ZIP', accent: '#f43f5e' },
  anythingllm: { short: 'AL', formats: 'JSON · JSONL', accent: '#0ea5e9' },
};

export type PlatformPickerMode = 'idle' | 'detecting' | 'confirmed' | 'choose';

export interface PlatformPickerViewModel {
  mode: PlatformPickerMode;
  selected?: BrowserAdapterName;
  suggested?: BrowserAdapterName;
  candidates?: BrowserAdapterName[];
  reason?: string;
  manual?: boolean;
}

export function buildPlatformPickerOptions(): BrowserAdapterName[] {
  return [...BROWSER_ADAPTERS];
}

export function labelForAdapter(adapter: BrowserAdapterName): string {
  return adapterLabel(adapter);
}

export function detectionCandidates(result: DetectExportResult): BrowserAdapterName[] {
  return [result.adapter, ...result.alternatives.map((item) => item.adapter)];
}

export function reasonForAdapter(
  result: DetectExportResult | null,
  adapter: BrowserAdapterName,
  manual: boolean,
): string {
  if (manual) {
    return 'Selected manually';
  }
  if (!result) {
    return '';
  }
  if (result.adapter === adapter) {
    return result.reason;
  }
  return result.alternatives.find((item) => item.adapter === adapter)?.reason ?? '';
}

export function platformStatusText(view: PlatformPickerViewModel): string {
  switch (view.mode) {
    case 'idle':
      if (view.selected) {
        return `${labelForAdapter(view.selected)} selected — upload your export`;
      }
      return 'Auto-detect on upload, or pick a platform now';
    case 'detecting':
      return 'Analyzing export format…';
    case 'choose':
      return 'Likely matches highlighted — or pick any platform';
    case 'confirmed':
      if (view.manual) {
        return `${labelForAdapter(view.selected!)} selected manually`;
      }
      return view.selected
        ? `Detected ${labelForAdapter(view.selected)}`
        : 'Platform confirmed';
    default: {
      const exhaustive: never = view.mode;
      return exhaustive;
    }
  }
}
