import { getFormaApiOrigin } from './api-origin.ts';
import { getFormaSiteOrigin } from './site-origin.ts';

try {
  const apiOrigin = getFormaApiOrigin();
  const siteOrigin = getFormaSiteOrigin();
  process.stdout.write(`Forma frontend configuration validated; site ${new URL(siteOrigin).host}, API ${new URL(apiOrigin).host}.\n`);
} catch (error) {
  process.stderr.write(`${error instanceof Error ? error.message : 'Frontend configuration is invalid.'}\n`);
  process.exitCode = 1;
}
