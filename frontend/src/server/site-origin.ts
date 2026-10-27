export function getFormaSiteOrigin(environment: NodeJS.ProcessEnv = process.env): string {
  const configured = environment.NEXT_PUBLIC_SITE_URL?.trim();
  if (!configured && environment.NODE_ENV === 'production') {
    throw new Error('NEXT_PUBLIC_SITE_URL must be configured for production.');
  }
  const siteUrl = new URL(configured || 'http://localhost:3000');
  if (!['http:', 'https:'].includes(siteUrl.protocol) || siteUrl.username || siteUrl.password || siteUrl.pathname !== '/' || siteUrl.search || siteUrl.hash) {
    throw new Error('NEXT_PUBLIC_SITE_URL must be an HTTP(S) origin without credentials, path, query or fragment.');
  }
  if (environment.NODE_ENV === 'production' && environment.APP_ENV !== 'staging') {
    if (siteUrl.protocol !== 'https:') throw new Error('NEXT_PUBLIC_SITE_URL must use HTTPS in production.');
    if (['localhost', '127.0.0.1', '[::1]', '::1'].includes(siteUrl.hostname)) throw new Error('Production site origin cannot use localhost or loopback.');
  }
  return siteUrl.origin;
}
