import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { ExportDataV1Schema, ExportManifestV1Schema } from '../src/v1.js';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const outputDir = path.join(scriptDir, '..', 'json-schema');

await mkdir(outputDir, { recursive: true });

const manifestSchema = zodToJsonSchema(ExportManifestV1Schema, {
  name: 'GrovePortManifestV1',
  $refStrategy: 'none',
});

const dataSchema = zodToJsonSchema(ExportDataV1Schema, {
  name: 'GrovePortDataV1',
  $refStrategy: 'none',
});

await writeFile(
  path.join(outputDir, 'manifest.v1.json'),
  `${JSON.stringify(manifestSchema, null, 2)}\n`,
  'utf8',
);

await writeFile(
  path.join(outputDir, 'data.v1.json'),
  `${JSON.stringify(dataSchema, null, 2)}\n`,
  'utf8',
);

console.log(`Wrote JSON Schema to ${outputDir}`);
