import { describe, expect, test } from 'bun:test';
import { collectReferencedAssetDatNames, pointerToDatName } from './assets.js';

describe('ChatGPT asset helpers', () => {
  test('pointerToDatName normalizes file-service pointers', () => {
    expect(pointerToDatName('file-service://file-U2ouxogTp8NFrcEfr4MgQB')).toBe(
      'file-U2ouxogTp8NFrcEfr4MgQB.dat',
    );
    expect(pointerToDatName('sediment://file_00000000d58071f4ace508d14f1c2e63')).toBe(
      'file_00000000d58071f4ace508d14f1c2e63.dat',
    );
  });

  test('collectReferencedAssetDatNames finds multimodal assets', () => {
    const conversations = [
      {
        title: 'x',
        create_time: 1,
        mapping: {
          a: {
            id: 'a',
            parent: null,
            message: {
              id: 'a',
              author: { role: 'user', name: null, metadata: {} },
              create_time: 1,
              update_time: null,
              content: {
                content_type: 'multimodal_text',
                parts: [
                  {
                    asset_pointer: 'file-service://file-ABC',
                    content_type: 'image_asset_pointer',
                  },
                  'hello',
                ],
              },
            },
          },
        },
      },
    ] as Parameters<typeof collectReferencedAssetDatNames>[0];

    expect([...collectReferencedAssetDatNames(conversations)]).toEqual(['file-ABC.dat']);
  });
});
