import { sha256HexBytes } from '@grove-port/core/browser';
import type { ExportAttachmentRef } from '@grove-port/schema';
import type { ChatGptConversation } from './types.js';

export function pointerToDatName(pointer: string): string {
  const fileKey = pointer.split('://').pop() ?? pointer;
  return fileKey.endsWith('.dat') ? fileKey : `${fileKey}.dat`;
}

export function collectReferencedAssetDatNames(
  conversations: ChatGptConversation[],
): Set<string> {
  const referenced = new Set<string>();

  for (const conversation of conversations) {
    for (const node of Object.values(conversation.mapping)) {
      const parts = node.message?.content?.parts;
      if (!parts) {
        continue;
      }

      for (const part of parts) {
        if (typeof part !== 'object' || part === null) {
          continue;
        }

        const record = part as Record<string, unknown>;
        if (typeof record.asset_pointer !== 'string') {
          continue;
        }

        referenced.add(pointerToDatName(record.asset_pointer));
      }
    }
  }

  return referenced;
}

function sanitizeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, '_');
}

function guessMimeType(filename: string): string | undefined {
  const lower = filename.toLowerCase();
  if (lower.endsWith('.png')) {
    return 'image/png';
  }
  if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) {
    return 'image/jpeg';
  }
  if (lower.endsWith('.webp')) {
    return 'image/webp';
  }
  if (lower.endsWith('.gif')) {
    return 'image/gif';
  }
  return undefined;
}

export interface StagedChatGptAssets {
  files: Record<string, unknown>[];
  attachments: ExportAttachmentRef[];
  packAttachments: Array<{ storage_name: string; bytes: Uint8Array; sha256: string }>;
}

export async function stageChatGptAssets({
  conversations,
  assetFileNames,
  assetFileBytes,
}: {
  conversations: ChatGptConversation[];
  assetFileNames: Record<string, string>;
  assetFileBytes: Record<string, Uint8Array>;
}): Promise<StagedChatGptAssets> {
  const referenced = collectReferencedAssetDatNames(conversations);

  const files: Record<string, unknown>[] = [];
  const attachments: ExportAttachmentRef[] = [];
  const packAttachments: StagedChatGptAssets['packAttachments'] = [];

  for (const datName of referenced) {
    const bytes = assetFileBytes[datName];
    if (!bytes) {
      continue;
    }

    const originalName = assetFileNames[datName] ?? datName;
    const fileId = datName.replace(/\.dat$/, '');
    const storageName = `${sanitizeFilename(fileId)}__${sanitizeFilename(originalName)}`;
    const sha256 = await sha256HexBytes(bytes);

    files.push({
      file_id: fileId,
      filename: originalName,
      type: guessMimeType(originalName),
      bytes: bytes.byteLength,
      source: 'chatgpt-export-v1',
      source_dat: datName,
    });

    attachments.push({
      file_id: fileId,
      storage_name: storageName,
      original_name: originalName,
      bytes: bytes.byteLength,
      mime_type: guessMimeType(originalName),
      sha256,
    });

    packAttachments.push({
      storage_name: storageName,
      bytes,
      sha256,
    });
  }

  return { files, attachments, packAttachments };
}
