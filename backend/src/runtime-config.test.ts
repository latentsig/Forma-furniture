import assert from 'node:assert/strict';
import test from 'node:test';
import { getBackendRuntimeConfig } from './runtime-config.ts';

test('local runtime defaults to loopback and validates its port', () => {
  assert.deepEqual(getBackendRuntimeConfig({ NODE_ENV: 'development' }), { port: 4100, host: '127.0.0.1' });
  assert.deepEqual(getBackendRuntimeConfig({ NODE_ENV: 'development', PORT: '5123', HOST: '127.0.0.1' }), { port: 5123, host: '127.0.0.1' });
  assert.throws(() => getBackendRuntimeConfig({ PORT: '70000' }), /PORT must be/);
});

test('production startup requires explicit network, HTTPS origins and MFA key configuration', () => {
  const valid = {
    NODE_ENV: 'production', HOST: '0.0.0.0', PORT: '4100',
    FRONTEND_ORIGIN: 'https://store.example', CUSTOMER_APP_ORIGIN: 'https://store.example',
    ADMIN_MFA_ENCRYPTION_KEY: 'a'.repeat(64),
  };
  assert.deepEqual(getBackendRuntimeConfig(valid), { port: 4100, host: '0.0.0.0' });
  assert.deepEqual(getBackendRuntimeConfig({ ...valid, APP_ENV: 'staging', FRONTEND_ORIGIN: 'http://127.0.0.1:13100', CUSTOMER_APP_ORIGIN: 'http://127.0.0.1:13100' }), { port: 4100, host: '0.0.0.0' });
  assert.throws(() => getBackendRuntimeConfig({ ...valid, HOST: '' }), /HOST is required/);
  assert.throws(() => getBackendRuntimeConfig({ ...valid, FRONTEND_ORIGIN: 'http://localhost:3000' }), /use HTTPS/);
  assert.throws(() => getBackendRuntimeConfig({ ...valid, ADMIN_MFA_ENCRYPTION_KEY: '' }), /32-byte hexadecimal/);
});
