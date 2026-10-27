import { describe, expect, it } from 'vitest';
import { getFormaApiOrigin } from './api-origin';

describe('deployed backend origin', () => {
  it('keeps the loopback default for local development only', () => {
    expect(getFormaApiOrigin({ NODE_ENV: 'development' })).toBe('http://127.0.0.1:4100');
    expect(() => getFormaApiOrigin({ NODE_ENV: 'production' })).toThrow(/FORMA_API_URL must be configured/);
  });

  it('rejects localhost production fallbacks and malformed origins', () => {
    expect(() => getFormaApiOrigin({ NODE_ENV: 'production', FORMA_API_URL: 'http://127.0.0.1:4100' })).toThrow(/cannot use loopback/);
    expect(getFormaApiOrigin({ NODE_ENV: 'production', APP_ENV: 'staging', FORMA_API_URL: 'http://127.0.0.1:14100' })).toBe('http://127.0.0.1:14100');
    expect(() => getFormaApiOrigin({ NODE_ENV: 'production', FORMA_API_URL: 'https://api.example/v1' })).toThrow(/without credentials, path/);
    expect(getFormaApiOrigin({ NODE_ENV: 'production', FORMA_API_URL: 'https://api.example' })).toBe('https://api.example');
    expect(getFormaApiOrigin({ NODE_ENV: 'production', FORMA_API_URL: 'http://forma-api:4100' })).toBe('http://forma-api:4100');
  });
});
