import { readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const assetsDir = join(root, 'public', 'academia-sem-medo', 'assets');

const validateWebp = (buffer, name) => {
  if (
    buffer.length < 16 ||
    buffer.toString('ascii', 0, 4) !== 'RIFF' ||
    buffer.toString('ascii', 8, 12) !== 'WEBP'
  ) {
    throw new Error(`Arte ${name} não é um WebP válido.`);
  }
};

const decodeChunkedAsset = async (name, chunkCount) => {
  const chunks = await Promise.all(
    Array.from({ length: chunkCount }, (_, index) =>
      readFile(join(assetsDir, `${name}.${index}.b64`), 'utf8')
    )
  );
  const buffer = Buffer.from(chunks.join('').replace(/\s/g, ''), 'base64');
  validateWebp(buffer, name);
  await writeFile(join(assetsDir, `${name}.webp`), buffer);
  console.log(`[Academia sem Medo] ${name}.webp gerado (${buffer.length} bytes)`);
};

await Promise.all([
  decodeChunkedAsset('cover', 3),
  decodeChunkedAsset('atlas', 5),
  decodeChunkedAsset('casal-fase-1', 1),
  decodeChunkedAsset('casal-fase-2', 1),
  decodeChunkedAsset('casal-fase-3', 1),
  decodeChunkedAsset('casal-fase-4', 1),
]);
