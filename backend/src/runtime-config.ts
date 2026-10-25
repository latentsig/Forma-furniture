export type BackendEnvironment = NodeJS.ProcessEnv;

function requireOrigin(name: string, value: string | undefined, requireHttps: boolean): string {
  if (!value) throw new Error(`${name} is required when NODE_ENV=production.`);
  let parsed: URL;
  try { parsed = new URL(value); } catch { throw new Error(`${name} must be an absolute HTTP(S) origin.`); }
  if (!['http:', 'https:'].includes(parsed.protocol) || parsed.username || parsed.password || parsed.pathname !== '/' || parsed.search || parsed.hash) {
    throw new Error(`${name} must be an HTTP(S) origin without credentials, path, query or fragment.`);
  }
  if (requireHttps && parsed.protocol !== 'https:') throw new Error(`${name} must use HTTPS in production.`);
  return parsed.origin;
}

export function getBackendRuntimeConfig(environment: BackendEnvironment = process.env) {
  const isProduction = environment.NODE_ENV === 'production';
  const rawPort = environment.PORT?.trim() || '4100';
  const port = Number(rawPort);
  if (!Number.isSafeInteger(port) || port < 1 || port > 65535) throw new Error('PORT must be an integer from 1 to 65535.');

  const host = environment.HOST?.trim() || (isProduction ? '' : '127.0.0.1');
  if (!host) throw new Error('HOST is required when NODE_ENV=production.');
  if (isProduction && !environment.HOST?.trim()) throw new Error('Set HOST explicitly for production (for example, 0.0.0.0 behind a controlled service network).');

  if (isProduction) {
    const enforceHttps = environment.APP_ENV !== 'staging';
    const frontendOrigin = requireOrigin('FRONTEND_ORIGIN', environment.FRONTEND_ORIGIN, enforceHttps);
    const customerOrigin = requireOrigin('CUSTOMER_APP_ORIGIN', environment.CUSTOMER_APP_ORIGIN, enforceHttps);
    if (enforceHttps && [frontendOrigin, customerOrigin].some((origin) => ['localhost', '127.0.0.1'].includes(new URL(origin).hostname))) {
      throw new Error('Production customer origins cannot use localhost or loopback.');
    }
    if (!/^[a-f0-9]{64}$/i.test(environment.ADMIN_MFA_ENCRYPTION_KEY ?? '')) {
      throw new Error('ADMIN_MFA_ENCRYPTION_KEY must be configured as a 32-byte hexadecimal key in production.');
    }
  }
  return { port, host };
}
