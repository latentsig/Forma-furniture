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
          path: resolve(process.cwd(), '..', 'docs', 'screenshots', `phase2-collection-${width}.png`),
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
        await page.screenshot({ path: resolve(process.cwd(), '..', 'docs', 'screenshots', 'phase2-home-390.png') });
      }
    }
  });
});

test.describe('catalogue and shopping demo', () => {
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

  test('product gallery supports thumbnails, zoom controls and keyboard; bag and demo checkout behave clearly', async ({ page }) => {
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

    await page.getByRole('button', { name: 'Add to demo bag +' }).click();
    const bag = page.getByRole('dialog', { name: /Your bag/ });
    await expect(bag).toBeVisible();
    await expect(bag).toContainText('storefront preview');
    await expect(bag).toContainText('Sunday Oak Lounge Chair');
    await bag.getByRole('button', { name: 'View demo checkout' }).click();
    const checkout = page.getByRole('alertdialog', { name: 'Demo only' });
    await expect(checkout).toContainText('No purchase has been created');
    await checkout.getByRole('button', { name: 'Return to bag' }).click();
    await bag.getByRole('button', { name: 'Close bag' }).click();
    await page.goto('/collections');
    await page.getByRole('button', { name: /Open demo bag, 1 items/ }).click();
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
  const routes = ['/', '/collections', `/product?id=${productId}`, '/spaces', '/craft', '/journal', '/visit'];
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
