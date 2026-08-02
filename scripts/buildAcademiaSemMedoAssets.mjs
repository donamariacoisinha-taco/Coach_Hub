import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const assetsDir = join(root, 'public', 'academia-sem-medo', 'assets');

const decodeAsset = async (name, chunkCount) => {
  const chunks = await Promise.all(
    Array.from({ length: chunkCount }, (_, index) =>
      readFile(join(assetsDir, `${name}.${index}.b64`), 'utf8')
    )
  );

  const base64 = chunks.join('').replace(/\s/g, '');
  const buffer = Buffer.from(base64, 'base64');

  if (
    buffer.length < 16 ||
    buffer.toString('ascii', 0, 4) !== 'RIFF' ||
    buffer.toString('ascii', 8, 12) !== 'WEBP'
  ) {
    throw new Error(`Arte ${name} não é um WebP válido.`);
  }

  const outputPath = join(assetsDir, `${name}.webp`);
  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, buffer);
  console.log(`[Academia sem Medo] ${name}.webp gerado (${buffer.length} bytes)`);
};

await Promise.all([
  decodeAsset('cover', 3),
  decodeAsset('atlas', 5),
]);
