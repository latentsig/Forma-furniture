import assert from 'node:assert/strict';
import { test } from 'node:test';
import { exchangeFacebookCode } from './facebook-auth.ts';

test('Facebook authorization code is exchanged server-side and only validated profile fields are returned', async () => {
  const saved = {
    appId: process.env.FACEBOOK_APP_ID,
    appSecret: process.env.FACEBOOK_APP_SECRET,
    version: process.env.FACEBOOK_GRAPH_VERSION,
    redirect: process.env.FACEBOOK_REDIRECT_URI,
    fetch: globalThis.fetch,
  };
  process.env.FACEBOOK_APP_ID = 'test-app-id';
  process.env.FACEBOOK_APP_SECRET = 'test-app-secret';
  process.env.FACEBOOK_GRAPH_VERSION = 'v99.0';
  process.env.FACEBOOK_REDIRECT_URI = 'http://localhost:3104/api/customer/facebook/callback';
  const requests: URL[] = [];
  globalThis.fetch = (async (input: URL | RequestInfo) => {
    const url = input instanceof URL ? input : new URL(String(input));
    requests.push(url);
    if (url.pathname.endsWith('/oauth/access_token')) return Response.json({ access_token: 'private-access-token', token_type: 'bearer' });
    assert.equal(url.searchParams.get('fields'), 'id,name,email');
    assert.equal(url.searchParams.get('access_token'), 'private-access-token');
    return Response.json({ id: '123456789', name: 'Forma Customer', email: 'Customer@example.com' });
  }) as typeof fetch;
  try {
    const identity = await exchangeFacebookCode('one-use-code', process.env.FACEBOOK_REDIRECT_URI);
    assert.deepEqual(identity, { id: '123456789', email: 'customer@example.com', name: 'Forma Customer' });
    assert.equal(requests.length, 2);
    assert.equal(requests[0].searchParams.get('client_secret'), 'test-app-secret');
    assert.equal(JSON.stringify(identity).includes('private-access-token'), false);
  } finally {
    globalThis.fetch = saved.fetch;
    for (const [key, value] of Object.entries({ FACEBOOK_APP_ID: saved.appId, FACEBOOK_APP_SECRET: saved.appSecret, FACEBOOK_GRAPH_VERSION: saved.version, FACEBOOK_REDIRECT_URI: saved.redirect })) {
      if (value === undefined) delete process.env[key]; else process.env[key] = value;
    }
  }
});

test('Facebook code exchange rejects callback mismatch and missing server credentials before network access', async () => {
  const saved = { appId: process.env.FACEBOOK_APP_ID, appSecret: process.env.FACEBOOK_APP_SECRET, redirect: process.env.FACEBOOK_REDIRECT_URI };
  process.env.FACEBOOK_APP_ID = 'test-app-id';
  process.env.FACEBOOK_APP_SECRET = 'test-app-secret';
  process.env.FACEBOOK_REDIRECT_URI = 'http://localhost:3104/api/customer/facebook/callback';
  try {
    assert.equal(await exchangeFacebookCode('one-use-code', 'http://evil.example/callback'), null);
    delete process.env.FACEBOOK_APP_SECRET;
    assert.equal(await exchangeFacebookCode('one-use-code', process.env.FACEBOOK_REDIRECT_URI), null);
  } finally {
    for (const [key, value] of Object.entries({ FACEBOOK_APP_ID: saved.appId, FACEBOOK_APP_SECRET: saved.appSecret, FACEBOOK_REDIRECT_URI: saved.redirect })) {
      if (value === undefined) delete process.env[key]; else process.env[key] = value;
    }
  }
});
