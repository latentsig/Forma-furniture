const LOCAL_API_ORIGIN = 'http://127.0.0.1:4100';

/** Resolve the server-to-server API origin without silently pointing a deployed
 * frontend at its own container's loopback address. */
export function getFormaApiOrigin(environment: NodeJS.ProcessEnv = process.env): string {
  const configured = environment.FORMA_API_URL?.trim();
  if (!configured) {
    if (environment.NODE_ENV === 'production') {
      throw new Error('FORMA_API_URL must be configured for production.');
    }
    return LOCAL_API_ORIGIN;
  }

  let apiUrl: URL;
  try {
    apiUrl = new URL(configured);
  } catch {
    throw new Error('FORMA_API_URL must be an absolute HTTP(S) origin.');
  }
  if (!['http:', 'https:'].includes(apiUrl.protocol) || apiUrl.username || apiUrl.password ||
      apiUrl.pathname !== '/' || apiUrl.search || apiUrl.hash) {
    throw new Error('FORMA_API_URL must be an HTTP(S) origin without credentials, path, query or fragment.');
  }
  if (environment.NODE_ENV === 'production' && environment.APP_ENV !== 'staging' && ['localhost', '127.0.0.1', '[::1]', '::1'].includes(apiUrl.hostname)) {
    throw new Error('FORMA_API_URL cannot use loopback in production; configure the deployed API origin.');
  }
  return apiUrl.origin;
}
