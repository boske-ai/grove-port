import {
  BROWSER_ADAPTERS,
  type BrowserAdapterName,
  type BrowserExportStats,
  type DetectExportResult,
} from '@grove-port/convert-browser';
import { renderCompatibilityGuide } from './compatibility.js';
import {
  labelForAdapter,
  PLATFORM_META,
  platformStatusText,
  reasonForAdapter,
  type PlatformPickerViewModel,
} from './platform-picker.js';
import { ConverterWorkerClient } from './worker-client.js';

const worker = new ConverterWorkerClient();

const adapterSelect = document.querySelector<HTMLSelectElement>('#adapter');
const emailInput = document.querySelector<HTMLInputElement>('#email');
const fileInput = document.querySelector<HTMLInputElement>('#file');
const dropzone = document.querySelector<HTMLDivElement>('#dropzone');
const fileSummary = document.querySelector<HTMLDivElement>('#file-summary');
const fileNameEl = document.querySelector<HTMLParagraphElement>('#file-name');
const fileSizeEl = document.querySelector<HTMLParagraphElement>('#file-size');
const clearFileButton = document.querySelector<HTMLButtonElement>('#clear-file');
const platformPicker = document.querySelector<HTMLDivElement>('#platform-picker');
const platformStatus = document.querySelector<HTMLParagraphElement>('#platform-status');
const platformReason = document.querySelector<HTMLParagraphElement>('#platform-reason');
const platformBadge = document.querySelector<HTMLSpanElement>('#platform-badge');
const previewButton = document.querySelector<HTMLButtonElement>('#preview');
const convertButton = document.querySelector<HTMLButtonElement>('#convert');
const statusEl = document.querySelector<HTMLDivElement>('#status');
const previewOutput = document.querySelector<HTMLPreElement>('#preview-output');
const statsGrid = document.querySelector<HTMLDivElement>('#stats-grid');
const guideContent = document.querySelector<HTMLDivElement>('#guide-content');
const stepUpload = document.querySelector<HTMLLIElement>('#step-upload');
const stepReview = document.querySelector<HTMLLIElement>('#step-review');
const stepDownload = document.querySelector<HTMLLIElement>('#step-download');
const workspacePanel = document.querySelector<HTMLElement>('.workspace');

if (
  !adapterSelect ||
  !emailInput ||
  !fileInput ||
  !dropzone ||
  !fileSummary ||
  !fileNameEl ||
  !fileSizeEl ||
  !clearFileButton ||
  !platformPicker ||
  !platformStatus ||
  !platformReason ||
  !platformBadge ||
  !previewButton ||
  !convertButton ||
  !statusEl ||
  !previewOutput ||
  !statsGrid ||
  !guideContent ||
  !stepUpload ||
  !stepReview ||
  !stepDownload ||
  !workspacePanel
) {
  throw new Error('Converter UI failed to mount');
}

let pendingDetection: DetectExportResult | null = null;
let adapterConfirmed = false;
let adapterManual = false;
let activeJob = 0;
let busyJobId: number | null = null;
let pickerView: PlatformPickerViewModel = { mode: 'idle' };

for (const adapter of BROWSER_ADAPTERS) {
  const option = document.createElement('option');
  option.value = adapter;
  option.textContent = labelForAdapter(adapter);
  adapterSelect.appendChild(option);
}

function buildPlatformCards(): void {
  platformPicker.innerHTML = BROWSER_ADAPTERS.map((adapter) => {
    const meta = PLATFORM_META[adapter];
    return `
      <button
        type="button"
        class="platform-card"
        data-adapter="${adapter}"
        role="radio"
        aria-checked="false"
        aria-label="${labelForAdapter(adapter)}"
        disabled
        style="--platform-accent:${meta.accent}"
      >
        <span class="platform-card-icon">${meta.short}</span>
        <span class="platform-card-body">
          <span class="platform-card-name">${labelForAdapter(adapter)}</span>
          <span class="platform-card-formats">${meta.formats}</span>
        </span>
        <span class="platform-card-mark" aria-hidden="true"></span>
      </button>
    `;
  }).join('');
}

function renderPlatformPicker(): void {
  platformPicker.classList.toggle('is-detecting', pickerView.mode === 'detecting');
  platformPicker.classList.toggle('is-choose', pickerView.mode === 'choose');
  platformStatus.textContent = platformStatusText(pickerView);

  const cards = platformPicker.querySelectorAll<HTMLButtonElement>('.platform-card');
  for (const card of cards) {
    const adapter = card.dataset.adapter as BrowserAdapterName;
    const isSelected = pickerView.selected === adapter;
    const isSuggested = pickerView.suggested === adapter;
    const isCandidate = pickerView.candidates?.includes(adapter) ?? false;
    const isPreselected = pickerView.mode === 'idle' && pickerView.selected === adapter;

    card.disabled = pickerView.mode === 'detecting' || busyJobId !== null;
    card.setAttribute(
      'aria-checked',
      (isSelected && pickerView.mode === 'confirmed') || isPreselected ? 'true' : 'false',
    );
    card.classList.toggle('is-selected', (isSelected && pickerView.mode === 'confirmed') || isPreselected);
    card.classList.toggle('is-suggested', isSuggested && pickerView.mode === 'choose');
    card.classList.toggle('is-candidate', isCandidate && pickerView.mode === 'choose' && !isSuggested);
    card.classList.toggle('is-dimmed', false);
  }

  if (pickerView.mode === 'confirmed' && pickerView.selected) {
    const reason = reasonForAdapter(pendingDetection, pickerView.selected, adapterManual);
    platformReason.textContent = reason;
    platformReason.classList.remove('hidden');
    platformBadge.textContent = adapterManual ? 'Manual' : 'Auto-detected';
    platformBadge.classList.remove('hidden', 'is-warning');
    platformBadge.classList.add('is-success');
  } else if (pickerView.mode === 'choose') {
    platformReason.textContent =
      'We found mixed signals in this export. Pick a highlighted match, or choose any platform manually.';
    platformReason.classList.remove('hidden');
    platformBadge.textContent = 'Confirm';
    platformBadge.classList.remove('hidden', 'is-success');
    platformBadge.classList.add('is-warning');
  } else if (pickerView.mode === 'idle' && pickerView.selected) {
    platformReason.textContent = 'We will still scan your file on upload, but start from your selection.';
    platformReason.classList.remove('hidden');
    platformBadge.textContent = 'Manual';
    platformBadge.classList.remove('hidden', 'is-warning');
    platformBadge.classList.add('is-success');
  } else if (pickerView.mode === 'detecting') {
    platformReason.classList.add('hidden');
    platformReason.textContent = '';
    platformBadge.classList.add('hidden');
  } else {
    platformReason.classList.add('hidden');
    platformReason.textContent = '';
    platformBadge.classList.add('hidden');
  }
}

function formatDisplayFileName(fileName: string): string {
  if (fileName.length <= 52) {
    return fileName;
  }

  const extensionIndex = fileName.lastIndexOf('.');
  const extension = extensionIndex > 0 ? fileName.slice(extensionIndex) : '';
  const base = extension ? fileName.slice(0, -extension.length) : fileName;

  if (base.length <= 44) {
    return fileName;
  }

  return `${base.slice(0, 20)}…${base.slice(-12)}${extension}`;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  if (bytes < 1024 * 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

function setStatus(message: string, tone: 'idle' | 'loading' | 'success' | 'error' = 'idle'): void {
  statusEl.textContent = message;
  statusEl.classList.remove('is-loading', 'is-success', 'is-error');
  if (tone === 'loading') {
    statusEl.classList.add('is-loading');
  } else if (tone === 'success') {
    statusEl.classList.add('is-success');
  } else if (tone === 'error') {
    statusEl.classList.add('is-error');
  }
}

function setFileLoading(isLoading: boolean): void {
  fileSummary.classList.toggle('is-loading', isLoading);
}

function syncActionButtons(): void {
  const canAct = hasSelectedFile() && adapterConfirmed;
  const blocked = busyJobId !== null;
  previewButton.disabled = blocked || !canAct;
  convertButton.disabled = blocked || !canAct;
}

function setBusy(isBusy: boolean, jobId?: number): void {
  if (isBusy) {
    if (jobId === undefined) {
      return;
    }
    busyJobId = jobId;
  } else if (jobId === undefined || busyJobId === jobId) {
    busyJobId = null;
  } else {
    return;
  }

  syncActionButtons();
  workspacePanel.classList.toggle('is-busy', busyJobId !== null);
  workspacePanel.setAttribute('aria-busy', busyJobId !== null ? 'true' : 'false');
  renderPlatformPicker();
}

function hasSelectedFile(): boolean {
  return Boolean(fileInput.files?.[0]);
}

function setActionEnabled(enabled: boolean): void {
  if (busyJobId !== null) {
    return;
  }

  previewButton.disabled = !enabled;
  convertButton.disabled = !enabled;
}

function releaseBusyJob(jobId: number): void {
  if (busyJobId !== jobId) {
    return;
  }

  setFileLoading(false);
  setBusy(false, jobId);
}

function setStepState(step: 'upload' | 'review' | 'download'): void {
  const steps = [
    { element: stepUpload, id: 'upload' },
    { element: stepReview, id: 'review' },
    { element: stepDownload, id: 'download' },
  ] as const;

  const order = ['upload', 'review', 'download'];
  const activeIndex = order.indexOf(step);

  for (const [index, { element, id }] of steps.entries()) {
    element.classList.remove('is-active', 'is-done');
    if (index < activeIndex) {
      element.classList.add('is-done');
    } else if (index === activeIndex) {
      element.classList.add('is-active');
    } else if (id === 'upload' && hasSelectedFile()) {
      element.classList.add('is-done');
    }
  }
}

function updateGuide(adapter: BrowserAdapterName): void {
  guideContent.innerHTML = renderCompatibilityGuide(adapter);
}

async function yieldToBrowser(): Promise<void> {
  await new Promise<void>((resolve) => {
    setTimeout(resolve, 0);
  });
}

function formatError(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}

function selectedAdapter(): BrowserAdapterName {
  const value = adapterSelect.value;
  if (!BROWSER_ADAPTERS.includes(value as BrowserAdapterName)) {
    throw new Error(`Unsupported adapter: ${value}`);
  }
  return value as BrowserAdapterName;
}

function getManualPreselection(): BrowserAdapterName | null {
  if (pickerView.mode !== 'idle' || !pickerView.selected || !pickerView.manual) {
    return null;
  }

  return pickerView.selected;
}

function resolveOptionalEmail(): string | undefined {
  const value = emailInput.value.trim();
  emailInput.setCustomValidity('');

  if (!value) {
    return undefined;
  }

  if (!emailInput.checkValidity()) {
    throw new Error('Enter a valid email address, or leave the field empty.');
  }

  return value;
}

function confirmAdapter(adapter: BrowserAdapterName, reason: string, manual = false): void {
  if (!hasSelectedFile()) {
    return;
  }

  adapterSelect.value = adapter;
  adapterConfirmed = true;
  adapterManual = manual;
  pickerView = {
    mode: 'confirmed',
    selected: adapter,
    reason,
    manual,
  };
  setFileLoading(false);
  fileSummary.classList.add('is-detected');
  renderPlatformPicker();
  updateGuide(adapter);
  setActionEnabled(true);
  setStatus(
    manual
      ? `Using ${labelForAdapter(adapter)} (manual selection).`
      : `Using ${labelForAdapter(adapter)} — ${reason}`,
    'success',
  );
}

function applyDetection(
  result: DetectExportResult,
  manualPreselection: BrowserAdapterName | null = null,
): void {
  if (!hasSelectedFile()) {
    return;
  }

  pendingDetection = result;

  if (manualPreselection) {
    const matchesDetection = manualPreselection === result.adapter;
    confirmAdapter(
      manualPreselection,
      matchesDetection ? result.reason : 'Selected before upload',
      true,
    );
    return;
  }

  adapterSelect.value = result.adapter;
  updateGuide(result.adapter);

  if (result.confidence === 'low') {
    adapterConfirmed = false;
    adapterManual = false;
    pickerView = {
      mode: 'choose',
      suggested: result.adapter,
      candidates: [result.adapter, ...result.alternatives.map((item) => item.adapter)],
    };
    setFileLoading(false);
    renderPlatformPicker();
    setActionEnabled(false);
    setStatus('Pick the source platform that matches your export.', 'loading');
    return;
  }

  confirmAdapter(result.adapter, result.reason, false);
}

function showFileSummary(file: File): void {
  fileNameEl.textContent = formatDisplayFileName(file.name);
  fileNameEl.title = file.name;
  fileSizeEl.textContent = formatBytes(file.size);
  fileSummary.classList.remove('hidden', 'is-detected');
  dropzone.classList.add('has-file');
  setFileLoading(true);
  setStepState('review');
  pickerView = { mode: 'detecting' };
  renderPlatformPicker();
  fileSummary.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function clearFileSelection(): void {
  activeJob += 1;
  worker.cancelPending();
  void worker.clear();
  fileInput.value = '';
  fileNameEl.textContent = '';
  fileNameEl.removeAttribute('title');
  fileSummary.classList.add('hidden');
  fileSummary.classList.remove('is-detected', 'is-loading');
  dropzone.classList.remove('has-file');
  statsGrid.classList.add('hidden');
  statsGrid.replaceChildren();
  previewOutput.classList.add('hidden');
  previewOutput.classList.remove('error');
  previewOutput.textContent = '';
  pendingDetection = null;
  adapterConfirmed = false;
  adapterManual = false;
  pickerView = { mode: 'idle' };
  setFileLoading(false);
  setBusy(false);
  renderPlatformPicker();
  setActionEnabled(false);
  setStepState('upload');
  setStatus('');
  updateGuide('chatgpt');
  adapterSelect.value = 'chatgpt';
}

function renderStats(stats: BrowserExportStats): void {
  statsGrid.replaceChildren();

  const cards: Array<{
    label: string;
    value: string;
    note?: string;
    wide?: boolean;
  }> = [
    { label: 'Conversations', value: String(stats.conversationCount) },
    { label: 'Messages', value: String(stats.messageCount) },
    { label: 'Forked threads', value: String(stats.forkedConversations) },
    { label: 'Attachments', value: String(stats.attachmentCount) },
    { label: 'Files packed', value: String(stats.fileCount) },
    {
      label: 'Source format',
      value: stats.sourceFormat,
      note: stats.userEmail,
      wide: true,
    },
  ];

  for (const [index, card] of cards.entries()) {
    const article = document.createElement('article');
    article.className = card.wide ? 'stat-card stat-card-wide' : 'stat-card';
    article.style.animationDelay = `${index * 60}ms`;

    const label = document.createElement('p');
    label.className = 'stat-label';
    label.textContent = card.label;

    const value = document.createElement('p');
    value.className = 'stat-value';
    value.textContent = card.value;

    article.append(label, value);

    if (card.note) {
      const note = document.createElement('p');
      note.className = 'stat-note';
      note.textContent = card.note;
      article.append(note);
    }

    statsGrid.append(article);
  }

  statsGrid.classList.remove('hidden');
}

async function handleFileSelected(file: File): Promise<void> {
  const jobId = ++activeJob;
  const manualPreselection = getManualPreselection();

  worker.cancelPending();
  if (busyJobId !== null) {
    setBusy(false);
  }

  previewOutput.classList.add('hidden');
  previewOutput.classList.remove('error');
  previewOutput.textContent = '';
  statsGrid.classList.add('hidden');
  statsGrid.replaceChildren();
  pendingDetection = null;
  adapterConfirmed = false;
  adapterManual = false;
  setActionEnabled(false);

  showFileSummary(file);
  setStatus(`Reading ${file.name}…`, 'loading');
  await yieldToBrowser();

  try {
    const bytes = new Uint8Array(await file.arrayBuffer());
    if (jobId !== activeJob) {
      return;
    }

    setStatus(`Detecting source platform…`, 'loading');
    await worker.loadFile(file.name, bytes);
    if (jobId !== activeJob) {
      return;
    }

    const detected = await worker.detect();
    if (jobId !== activeJob) {
      return;
    }

    applyDetection(detected, manualPreselection);
  } catch (error) {
    if (jobId !== activeJob) {
      return;
    }

    adapterConfirmed = false;
    setFileLoading(false);

    if (manualPreselection) {
      pickerView = { mode: 'idle', selected: manualPreselection, manual: true };
      adapterSelect.value = manualPreselection;
      updateGuide(manualPreselection);
      renderPlatformPicker();
      setActionEnabled(false);
      setStatus(
        `${formatError(error)} Confirm ${labelForAdapter(manualPreselection)} below if you still want to proceed.`,
        'error',
      );
      return;
    }

    pickerView = { mode: 'idle' };
    renderPlatformPicker();
    setActionEnabled(false);
    setStatus(formatError(error), 'error');
  }
}

function isManualPlatformPick(adapter: BrowserAdapterName): boolean {
  if (!hasSelectedFile() || !pendingDetection) {
    return true;
  }
  if (pickerView.mode === 'choose') {
    return adapter !== pickerView.suggested;
  }
  if (pickerView.mode === 'confirmed') {
    return adapter !== pickerView.selected;
  }
  return true;
}

function preselectPlatform(adapter: BrowserAdapterName): void {
  adapterSelect.value = adapter;
  adapterConfirmed = false;
  adapterManual = true;
  pickerView = { mode: 'idle', selected: adapter, manual: true };
  renderPlatformPicker();
  updateGuide(adapter);
  setActionEnabled(false);
  setStatus(`${labelForAdapter(adapter)} selected — upload your export to continue.`);
}

function handlePlatformPick(adapter: BrowserAdapterName): void {
  if (pickerView.mode === 'detecting' || busyJobId !== null) {
    return;
  }

  if (!hasSelectedFile()) {
    preselectPlatform(adapter);
    return;
  }

  const manual = isManualPlatformPick(adapter);
  const reason = manual
    ? 'Selected manually'
    : reasonForAdapter(pendingDetection, adapter, false) || 'Selected manually';

  confirmAdapter(adapter, reason, manual);
}

platformPicker.addEventListener('click', (event) => {
  const target = (event.target as HTMLElement).closest<HTMLButtonElement>('.platform-card');
  if (!target?.dataset.adapter || target.disabled) {
    return;
  }
  handlePlatformPick(target.dataset.adapter as BrowserAdapterName);
});

dropzone.addEventListener('click', () => {
  fileInput.click();
});

dropzone.addEventListener('keydown', (event) => {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault();
    fileInput.click();
  }
});

dropzone.addEventListener('dragover', (event) => {
  event.preventDefault();
  dropzone.classList.add('is-dragover');
});

dropzone.addEventListener('dragleave', () => {
  dropzone.classList.remove('is-dragover');
});

dropzone.addEventListener('drop', (event) => {
  event.preventDefault();
  dropzone.classList.remove('is-dragover');

  const file = event.dataTransfer?.files.item(0);
  if (!file) {
    return;
  }

  const transfer = new DataTransfer();
  transfer.items.add(file);
  fileInput.files = transfer.files;
  void handleFileSelected(file);
});

fileInput.addEventListener('change', () => {
  const file = fileInput.files?.[0];
  if (!file) {
    clearFileSelection();
    return;
  }

  void handleFileSelected(file);
});

clearFileButton.addEventListener('click', () => {
  clearFileSelection();
});

previewButton.addEventListener('click', async () => {
  const jobId = ++activeJob;
  setBusy(true, jobId);
  setFileLoading(true);
  previewOutput.classList.add('hidden');
  setStatus('Analyzing export in the background…', 'loading');

  try {
    const userEmail = resolveOptionalEmail();
    const stats = await worker.preview(selectedAdapter(), userEmail);
    if (jobId !== activeJob) {
      return;
    }

    renderStats(stats);
    setStatus(
      `Ready — ${stats.conversationCount} conversations, ${stats.messageCount} messages.`,
      'success',
    );
    setStepState('download');
  } catch (error) {
    if (jobId !== activeJob) {
      return;
    }

    const message = formatError(error);
    previewOutput.textContent = message;
    previewOutput.classList.remove('hidden');
    previewOutput.classList.add('error');
    setStatus(message, 'error');
    console.error('[grove-port preview]', error);
  } finally {
    releaseBusyJob(jobId);
  }
});

convertButton.addEventListener('click', async () => {
  const jobId = ++activeJob;
  setBusy(true, jobId);
  setFileLoading(true);
  setStatus('Converting in the background…', 'loading');

  try {
    const userEmail = resolveOptionalEmail();
    const result = await worker.convert(selectedAdapter(), userEmail);
    if (jobId !== activeJob) {
      return;
    }

    const blob = new Blob([result.bytes], { type: 'application/gzip' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = result.fileName;
    anchor.click();
    URL.revokeObjectURL(url);

    setStatus(`Downloaded ${result.fileName} — ${result.messageCount} messages packed.`, 'success');
    setStepState('download');
  } catch (error) {
    if (jobId !== activeJob) {
      return;
    }

    const message = formatError(error);
    previewOutput.textContent = message;
    previewOutput.classList.remove('hidden');
    previewOutput.classList.add('error');
    setStatus(message, 'error');
    console.error('[grove-port convert]', error);
  } finally {
    releaseBusyJob(jobId);
  }
});

buildPlatformCards();
renderPlatformPicker();
updateGuide('chatgpt');
setStepState('upload');
setStatus('Upload an export, or pick a source platform first.');
