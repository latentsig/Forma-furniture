import { cp, mkdir, stat } from 'node:fs/promises';
import { resolve } from 'node:path';

const projectRoot = process.cwd();
const standaloneRoot = resolve(projectRoot, '.next', 'standalone');

async function copyIfPresent(source: string, destination: string) {
  try {
    await stat(source);
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT') return;
    throw error;
  }

  await mkdir(resolve(destination, '..'), { recursive: true });
  await cp(source, destination, { recursive: true, force: true });
}

await copyIfPresent(resolve(projectRoot, '.next', 'static'), resolve(standaloneRoot, '.next', 'static'));
await copyIfPresent(resolve(projectRoot, 'public'), resolve(standaloneRoot, 'public'));
