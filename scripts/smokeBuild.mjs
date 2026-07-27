import { access, readFile } from 'node:fs/promises';
import path from 'node:path';
import { spawn } from 'node:child_process';

const rootDir = process.cwd();
const distDir = path.join(rootDir, 'dist');
const port = Number(process.env.SMOKE_PORT || 3199);
const baseUrl = `http://127.0.0.1:${port}`;
const requiredFiles = [
  path.join(distDir, 'index.html'),
  path.join(distDir, 'server.mjs'),
  path.join(distDir, 'server.cjs'),
];

const assertFileExists = async (filePath) => {
  try {
    await access(filePath);
  } catch {
    throw new Error(`Required build file is missing: ${path.relative(rootDir, filePath)}`);
  }
};

const assertReferencedAssetsExist = async () => {
  const html = await readFile(path.join(distDir, 'index.html'), 'utf8');
  if (!html.includes('id="root"')) {
    throw new Error('dist/index.html does not contain the React root element.');
  }

  const assetReferences = [...html.matchAll(/(?:src|href)="([^"]+)"/g)]
    .map((match) => match[1])
    .filter((reference) => reference.startsWith('/assets/'));

  if (assetReferences.length === 0) {
    throw new Error('dist/index.html does not reference any compiled assets.');
  }

  for (const reference of assetReferences) {
    await assertFileExists(path.join(distDir, reference.replace(/^\//, '')));
  }
};

const waitForHealth = async (attempts = 30) => {
  let lastError;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const response = await fetch(`${baseUrl}/api/health`, { cache: 'no-store' });
      if (!response.ok) {
        throw new Error(`Health endpoint returned HTTP ${response.status}`);
      }
      const body = await response.json();
      if (body.status !== 'ok' || body.service !== 'kyron-os') {
        throw new Error(`Unexpected health payload: ${JSON.stringify(body)}`);
      }
      return body;
    } catch (error) {
      lastError = error;
      await new Promise((resolve) => setTimeout(resolve, 250));
    }
  }
  throw lastError || new Error('Server did not become healthy in time.');
};

const assertApplicationShell = async () => {
  const response = await fetch(baseUrl, { cache: 'no-store' });
  if (!response.ok) {
    throw new Error(`Application shell returned HTTP ${response.status}`);
  }
  const html = await response.text();
  if (!html.includes('id="root"')) {
    throw new Error('Application shell does not contain the React root element.');
  }
};

const run = async () => {
  for (const filePath of requiredFiles) {
    await assertFileExists(filePath);
  }
  await assertReferencedAssetsExist();

  const server = spawn(process.execPath, ['dist/server.cjs'], {
    cwd: rootDir,
    env: {
      ...process.env,
      NODE_ENV: 'production',
      PORT: String(port),
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  let serverOutput = '';
  server.stdout.on('data', (chunk) => {
    serverOutput += chunk.toString();
  });
  server.stderr.on('data', (chunk) => {
    serverOutput += chunk.toString();
  });

  try {
    const health = await waitForHealth();
    await assertApplicationShell();
    console.log(JSON.stringify({
      status: 'passed',
      health,
      checkedAssets: true,
      checkedApplicationShell: true,
    }, null, 2));
  } catch (error) {
    console.error(serverOutput.trim());
    throw error;
  } finally {
    server.kill('SIGTERM');
  }
};

run().catch((error) => {
  console.error('[P1 smoke test failed]', error);
  process.exitCode = 1;
});
