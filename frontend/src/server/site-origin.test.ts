import { describe, expect, it } from 'vitest';
import { getFormaSiteOrigin } from './site-origin';

describe('canonical frontend origin', () => {
  it('uses localhost only for development and requires a production site origin', () => {
    expect(getFormaSiteOrigin({ NODE_ENV: 'development' })).toBe('http://localhost:3000');
    expect(() => getFormaSiteOrigin({ NODE_ENV: 'production' })).toThrow(/must be configured/);
  });

  it('requires a public HTTPS production origin but allows localhost staging', () => {
    expect(() => getFormaSiteOrigin({ NODE_ENV: 'production', NEXT_PUBLIC_SITE_URL: 'http://store.example' })).toThrow(/HTTPS/);
    expect(() => getFormaSiteOrigin({ NODE_ENV: 'production', NEXT_PUBLIC_SITE_URL: 'https://localhost' })).toThrow(/loopback/);
    expect(getFormaSiteOrigin({ NODE_ENV: 'production', APP_ENV: 'staging', NEXT_PUBLIC_SITE_URL: 'http://127.0.0.1:13100' })).toBe('http://127.0.0.1:13100');
    expect(getFormaSiteOrigin({ NODE_ENV: 'production', NEXT_PUBLIC_SITE_URL: 'https://shop.example' })).toBe('https://shop.example');
  });
});
