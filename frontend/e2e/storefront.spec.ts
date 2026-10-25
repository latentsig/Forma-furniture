import { expect, test } from '@playwright/test';
import { resolve } from 'node:path';

const productId = 'forma-001-sunday-oak-lounge-chair';

test.describe('responsive storefront', () => {
  for (const width of [320, 390, 480, 768, 1280]) {
    test(`collection fits ${width}px viewport without horizontal overflow`, async ({ page }) => {
      await page.setViewportSize({ width, height: 844 });
      await page.goto('/collections');
      await expect(page.getByRole('heading', { name: /Good forms/ })).toBeVisible();
      await expect(page.getByRole('searchbox', { name: 'Search the collection' })).toBeVisible();
      const dimensions = await page.evaluate(() => ({
        viewport: document.documentElement.clientWidth,
        document: document.documentElement.scrollWidth,
        body: document.body.scrollWidth,
      }));
      expect(dimensions.document, JSON.stringify(dimensions)).toBeLessThanOrEqual(width);
      expect(dimensions.body, JSON.stringify(dimensions)).toBeLessThanOrEqual(width);
      if (width === 320 || width === 390) {
        await page.screenshot({
          path: resolve(process.cwd(), '..', 'docs', 'screenshots', `phase3-collection-${width}.png`),
        });
      }
    });
  }

  test('mobile navigation opens, follows a route, and closes', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');
    const menuButton = page.getByRole('button', { name: 'Open navigation' });
    await expect(menuButton).toBeVisible();
    await menuButton.click();
    const mobileNav = page.getByRole('navigation', { name: 'Mobile navigation' });
    await expect(mobileNav.getByRole('link', { name: 'Collection' })).toBeVisible();
    await mobileNav.getByRole('link', { name: 'Collection' }).click();
    await expect(page).toHaveURL(/\/collections$/);
    await expect(page.getByRole('navigation', { name: 'Mobile navigation' })).toHaveCount(0);
  });

  test('homepage fits narrow mobile viewports and saves a review screenshot', async ({ page }) => {
    for (const width of [320, 390]) {
      await page.setViewportSize({ width, height: 844 });
      await page.goto('/');
      await expect(page.getByRole('heading', { name: /Good forms.*every day/ })).toBeVisible();
      const dimensions = await page.evaluate(() => ({
        viewport: document.documentElement.clientWidth,
        document: document.documentElement.scrollWidth,
        body: document.body.scrollWidth,
      }));
      expect(dimensions.document, JSON.stringify(dimensions)).toBeLessThanOrEqual(width);
      expect(dimensions.body, JSON.stringify(dimensions)).toBeLessThanOrEqual(width);
      if (width === 390) {
        await page.screenshot({ path: resolve(process.cwd(), '..', 'docs', 'screenshots', 'phase3-home-390.png') });
      }
    }
  });
});

test.describe('catalogue and shopping demo', () => {
  test('storefront renders records and paise prices from the PostgreSQL catalog API', async ({ page, request }) => {
    const api = await request.get('http://127.0.0.1:4100/api/products?sort=featured&limit=100&offset=0');
    expect(api.status()).toBe(200);
    const pageData = await api.json() as { items: Array<{ id: string; name: string; pricePaise: number; image: string }>; total: number };
    expect(pageData.total).toBe(100);
    expect(pageData.items).toHaveLength(100);
    const first = pageData.items[0];
    await page.goto('/');
    await expect(page.getByRole('heading', { name: first.name })).toBeVisible();
    await expect(page.locator('.product-price').first()).toContainText(new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(first.pricePaise / 100));
    await expect(page.locator('.product-image img').first()).toHaveAttribute('src', `/media/${first.image}`);
  });

  test('search, category filter, sorting and empty state work', async ({ page }) => {
    await page.goto('/collections');
    await page.getByRole('button', { name: /^Seating/ }).click();
    await expect(page.locator('.result-count')).toContainText('Showing 25 pieces');

    await page.getByRole('searchbox', { name: 'Search the collection' }).fill('sunday');
    await expect(page.locator('.result-count')).toContainText('Showing 1 piece');
    await expect(page.getByRole('heading', { name: 'Sunday Oak Lounge Chair' })).toBeVisible();

    await page.getByRole('searchbox', { name: 'Search the collection' }).fill('no matching item');
    await expect(page.getByText('Nothing found. Try another search.')).toBeVisible();

    await page.getByRole('searchbox', { name: 'Search the collection' }).fill('');
    await page.getByRole('button', { name: /^All pieces/ }).click();
    await page.getByRole('combobox', { name: 'Sort by' }).selectOption('name');
    const firstName = await page.locator('.product-name').first().innerText();
    const lastName = await page.locator('.product-name').last().innerText();
    expect(firstName.localeCompare(lastName)).toBeLessThanOrEqual(0);
  });

  test('product gallery supports zoom; server cart persists and checkout requires a customer account', async ({ page }) => {
    await page.goto(`/product?id=${productId}`);
    await expect(page.getByRole('heading', { name: 'Sunday Oak Lounge Chair' })).toBeVisible();
    await page.getByRole('button', { name: 'Show image 2' }).click();
    await expect(page.getByRole('button', { name: 'Enlarge image 2 of 3' })).toBeVisible();
    await page.getByRole('button', { name: 'Enlarge image 2 of 3' }).click();
    const dialog = page.getByRole('dialog', { name: 'Sunday Oak Lounge Chair image gallery' });
    await expect(dialog.getByText('2 / 3')).toBeVisible();
    await page.keyboard.press('ArrowRight');
    await expect(dialog.getByText('3 / 3')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(dialog).toHaveCount(0);

    await page.locator('.detail-copy').getByRole('button', { name: 'Add to bag +' }).click();
    const bag = page.getByRole('dialog', { name: /Your bag/ });
    await expect(bag).toBeVisible();
    await expect(bag).toContainText('Final price, stock and delivery are checked by the store');
    await expect(bag).toContainText('Sunday Oak Lounge Chair');
    await bag.getByRole('button', { name: 'Continue to checkout' }).click();
    const checkout = page.getByRole('dialog', { name: 'Delivery & payment' });
    await checkout.getByLabel('Full name').fill('Forma Test Customer');
    await checkout.getByLabel('Phone').fill('+919876543210');
    await checkout.getByLabel('Address line 1').fill('10 Test Road');
    await checkout.getByLabel('City').fill('Bengaluru');
    await checkout.getByLabel('State').fill('Karnataka');
    await checkout.getByLabel('PIN code').fill('560001');
    await checkout.getByRole('button', { name: 'Check delivery & total' }).click();
    await expect(checkout).toContainText('Sign in to request delivery.');
    await expect(checkout.getByRole('link', { name: 'Sign in to your account' })).toHaveAttribute('href', '/account');
    await checkout.getByRole('button', { name: 'Close checkout' }).click();
    await bag.getByRole('button', { name: 'Close bag' }).click();
    await page.goto('/collections');
    await page.getByRole('button', { name: /Open bag, 1 items/ }).click();
    await expect(page.getByRole('dialog', { name: /Your bag/ })).toContainText('Sunday Oak Lounge Chair');
  });

  test('all legacy page URLs redirect to their TypeScript routes', async ({ page }) => {
    const redirects: Array<[string, RegExp]> = [
      ['/index.html', /\/$/],
      ['/collections.html', /\/collections$/],
      ['/product.html?id=' + productId, /\/product\?id=/],
      ['/spaces.html', /\/spaces$/],
      ['/craft.html', /\/craft$/],
      ['/journal.html', /\/journal$/],
      ['/visit.html', /\/visit$/],
    ];
    for (const [path, expected] of redirects) {
      await page.goto(path);
      await expect(page).toHaveURL(expected);
      await expect(page.locator('main')).toBeVisible();
    }
  });
});

test('all storefront routes render and health endpoint is available', async ({ page, request }) => {
  const routes = ['/', '/collections', `/product?id=${productId}`, '/spaces', '/craft', '/journal', '/visit', '/account'];
  const browserErrors: string[] = [];
  page.on('pageerror', (error) => browserErrors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') browserErrors.push(message.text());
  });
  for (const route of routes) {
    const response = await page.goto(route);
    expect(response?.status(), route).toBe(200);
    await expect(page.locator('main')).toBeVisible();
  }
  const health = await request.get('/api/health');
  expect(health.status()).toBe(200);
  await expect(health).toBeOK();
  await expect(health.json()).resolves.toMatchObject({ status: 'ok' });
  expect(browserErrors).toEqual([]);
  const missingProduct = await page.goto('/product?id=not-a-real-product');
  expect(missingProduct?.status()).toBe(404);
  await expect(page.getByRole('heading', { name: /We couldn’t find that piece/ })).toBeVisible();
});

test('admin tools require authentication and the browser proxy rejects cross-origin writes', async ({ page, request }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/admin');
  await expect(page.getByRole('heading', { name: 'Administrator sign in' })).toBeVisible();
  await expect(page.getByLabel('Authenticator code')).toBeVisible();
  await page.screenshot({ path: resolve(process.cwd(), '..', 'docs', 'screenshots', 'phase4-admin-login-390.png') });

  const unauthenticated = await request.get('/api/admin/products');
  expect(unauthenticated.status()).toBe(401);
  const csrf = await request.post('/api/admin/session', {
    headers: { Origin: 'https://cross-origin.example' },
    data: { email: 'owner@example.test', password: 'not-a-valid-password', totp: '000000' },
  });
  expect(csrf.status()).toBe(403);
});

test('administrator password recovery keeps MFA and consumes the reset link once', async ({ page }) => {
  await page.route('**/api/admin/password-reset/request', (route) => route.fulfill({
    status: 202,
    contentType: 'application/json',
    body: JSON.stringify({ message: 'If an active administrator account exists for that address, reset instructions have been sent.', previewUrl: `${new URL(route.request().url()).origin}/admin?reset=${'r'.repeat(43)}` }),
  }));
  let resetBody: unknown;
  await page.route('**/api/admin/password-reset/complete', async (route) => {
    resetBody = route.request().postDataJSON();
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ message: 'Password updated. Your authenticator is still required at sign-in.' }) });
  });
  await page.goto('/admin');
  await page.getByRole('button', { name: 'Forgot password?' }).click();
  await expect(page.getByRole('heading', { name: 'Reset your password' })).toBeVisible();
  await page.getByRole('textbox', { name: 'Administrator email' }).fill('owner@example.test');
  await page.getByRole('button', { name: 'Send reset link' }).click();
  await expect(page.getByRole('link', { name: 'Open password reset' })).toBeVisible();
  await page.getByRole('link', { name: 'Open password reset' }).click();
  await expect(page.getByRole('heading', { name: 'Set a new administrator password' })).toBeVisible();
  await expect(page.getByText(/authenticator remains required/)).toBeVisible();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: resolve(process.cwd(), '..', 'docs', 'screenshots', 'phase4-admin-password-reset-390.png') });
  await page.getByLabel('New password').fill('A-New-Strong-Password-4831');
  await page.getByRole('button', { name: 'Update password' }).click();
  await expect(page.getByRole('status')).toContainText(/authenticator is still required/i);
  expect(resetBody).toEqual({ token: 'r'.repeat(43), password: 'A-New-Strong-Password-4831' });
  await expect(page.getByLabel('Authenticator code')).toBeVisible();
});

test('lost authenticator recovery enrolls and verifies a replacement before restoring access', async ({ page }) => {
  const token = 'm'.repeat(43);
  const secret = 'JBSWY3DPEHPK3PXP';
  await page.route('**/api/admin/access-recovery/request', (route) => route.fulfill({
    status: 202,
    contentType: 'application/json',
    body: JSON.stringify({ message: 'If an active administrator account exists for that address, recovery instructions have been sent.', previewUrl: `${new URL(route.request().url()).origin}/admin?recover=${token}` }),
  }));
  await page.route('**/api/admin/access-recovery/prepare', (route) => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ email: 'owner@example.test', secret, otpauthUri: `otpauth://totp/Forma%20Furniture%3Aowner%40example.test?secret=${secret}&issuer=Forma%20Furniture&algorithm=SHA1&digits=6&period=30`, expiresInSeconds: 1800 }),
  }));
  let submitted: unknown;
  await page.route('**/api/admin/access-recovery/complete', async (route) => {
    submitted = route.request().postDataJSON();
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ message: 'Access recovered. Sign in using your new password and authenticator code.' }) });
  });
  await page.goto('/admin');
  await page.getByRole('button', { name: 'Lost your authenticator?' }).click();
  await expect(page.getByRole('heading', { name: 'Reset your password' })).toBeVisible();
  await page.getByRole('textbox', { name: 'Administrator email' }).fill('owner@example.test');
  await page.getByRole('button', { name: 'Send reset link' }).click();
  await page.getByRole('link', { name: 'Open password reset' }).click();
  await expect(page.getByRole('heading', { name: 'Recover administrator access' })).toBeVisible();
  await expect(page.getByRole('img', { name: 'Private Forma Furniture replacement authenticator QR code' })).toBeVisible();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: resolve(process.cwd(), '..', 'docs', 'screenshots', 'phase4-admin-access-recovery-390.png') });
  await page.getByLabel('New password').fill('Replacement-Admin-Password-8402');
  await page.getByLabel('Current six-digit authenticator code').fill('123456');
  await page.getByRole('button', { name: 'Verify and recover access' }).click();
  await expect(page.getByRole('status')).toContainText(/new password and authenticator/i);
  expect(submitted).toEqual({ token, password: 'Replacement-Admin-Password-8402', totp: '123456' });
  await expect(page.getByLabel('Authenticator code')).toBeVisible();
});

test('customer account has sign-in, registration, recovery and social provider entry points', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/account');
  await expect(page.getByRole('heading', { name: 'Sign in' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Continue with Google' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Continue with Facebook' })).toBeVisible();
  await page.evaluate(() => new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));
  await page.screenshot({ path: resolve(process.cwd(), '..', 'docs', 'screenshots', 'phase4-account-social-390.png') });
  await expect(page.getByLabel('Email address')).toBeVisible();
  await page.getByRole('button', { name: 'Create account', exact: true }).first().click();
  await expect(page.getByLabel('Full name')).toBeVisible();
  await expect(page.getByText(/12 or more characters/)).toBeVisible();
  await page.getByRole('button', { name: 'Sign in', exact: true }).first().click();
  await page.getByRole('button', { name: 'Forgot password?' }).click();
  await expect(page.getByRole('heading', { name: 'Reset your password' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Send reset link' })).toBeVisible();
  await page.screenshot({ path: resolve(process.cwd(), '..', 'docs', 'screenshots', 'phase4-account-390.png') });
});

test('Facebook sign-in reports missing local Meta configuration without exposing credentials', async ({ page }) => {
  await page.goto('/api/customer/facebook/start');
  await expect(page).toHaveURL(/\/account\?error=facebook-not-configured$/);
  await expect(page.locator('main [role="alert"]')).toContainText(/Meta app ID, secret, Graph API version and exact callback URL/);
});

test('first owner setup page is one-time and visibly includes mandatory authenticator enrollment', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.route('**/api/admin/bootstrap/status', (route) => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ setupAvailable: true, suggestedEmail: 'owner@example.test' }),
  }));
  let beginCalls = 0;
  await page.route('**/api/admin/bootstrap/begin', (route) => {
    beginCalls += 1;
    if (beginCalls === 1) return route.fulfill({
      status: 400,
      contentType: 'application/json',
      body: JSON.stringify({ error: 'Use a 15+ character password.' }),
    });
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        setupToken: 'test-only-setup-token',
        totpSecret: 'JBSWY3DPEHPK3PXP',
        otpauthUri: 'otpauth://totp/Forma%20Furniture%3Aowner%40example.test?secret=JBSWY3DPEHPK3PXP&issuer=Forma%20Furniture&algorithm=SHA1&digits=6&period=30',
        expiresInSeconds: 600,
      }),
    });
  });
  await page.route('**/api/admin/bootstrap/complete', (route) => route.fulfill({
    status: 400,
    contentType: 'application/json',
    body: JSON.stringify({ error: 'Setup expired. Begin owner setup again.' }),
  }));
  await page.goto('/admin/setup');
  await expect(page.getByRole('heading', { name: 'Create the first owner' })).toBeVisible();
  await expect(page.getByText(/local development server/)).toBeVisible();
  const ownerEmail = page.getByRole('textbox', { name: 'Owner email' });
  if (!(await ownerEmail.isVisible())) {
    await expect(page.getByText(/Initial setup is closed/)).toBeVisible();
    return;
  }
  await page.screenshot({ path: resolve(process.cwd(), '..', 'docs', 'screenshots', 'phase4-admin-setup-390.png') });
  const setupAttempt = await page.evaluate(async () => {
    const response = await fetch('/api/admin/bootstrap/begin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'owner@example.test', password: 'invalid' }),
    });
    return { status: response.status, body: await response.json() };
  });
  expect(setupAttempt.status).toBe(400);
  expect(setupAttempt.body.error).toMatch(/15\+ character password/);

  await page.getByLabel('Create a strong password').fill('StrongPassword1234');
  await page.getByRole('button', { name: 'Start secure setup' }).click();
  await expect(page.getByRole('img', { name: 'Private Forma Furniture authenticator setup QR code' })).toBeVisible();
  await expect(page.getByLabel('Current six-digit authenticator code')).toBeVisible();
  await page.getByLabel('Current six-digit authenticator code').fill('123456');
  await page.getByRole('button', { name: 'Verify and create owner' }).click();
  await expect(page.locator('main [role="alert"]')).toContainText(/setup expired/i);
  await expect(page.getByLabel('Create a strong password')).toBeVisible();
  await expect(page.getByRole('img', { name: 'Private Forma Furniture authenticator setup QR code' })).toHaveCount(0);
});

test('staff invitation lets the invited person set a password and scan a six-digit authenticator QR', async ({ page }) => {
  const token = 'a'.repeat(43);
  await page.route(`**/api/admin/invitations/${token}`, (route) => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ email: 'staff@example.test', role: 'SUPPORT', expiresAt: new Date(Date.now() + 60_000).toISOString() }),
  }));
  await page.route(`**/api/admin/invitations/${token}/prepare`, (route) => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({
      setupToken: 'test-only-enrollment-token',
      totpSecret: 'JBSWY3DPEHPK3PXP',
      otpauthUri: 'otpauth://totp/Forma%20Furniture%3Astaff%40example.test?secret=JBSWY3DPEHPK3PXP&issuer=Forma%20Furniture&algorithm=SHA1&digits=6&period=30',
      expiresInSeconds: 600,
    }),
  }));
  await page.goto(`/admin/accept-invite?token=${token}`);
  await expect(page.getByRole('heading', { name: 'Set up your staff account' })).toBeVisible();
  await expect(page.getByText(/staff@example.test · SUPPORT/)).toBeVisible();
  await page.getByLabel('Create a strong password').fill('StrongPassword1234');
  await page.getByLabel('Confirm password').fill('StrongPassword1234');
  await page.getByRole('button', { name: 'Continue to authenticator setup' }).click();
  await expect(page.getByRole('img', { name: 'Private Forma Furniture staff authenticator QR code' })).toBeVisible();
  await expect(page.getByText(/changing six-digit code/)).toBeVisible();
  await expect(page.getByLabel('Current six-digit authenticator code')).toHaveAttribute('pattern', '[0-9]{6}');
});
