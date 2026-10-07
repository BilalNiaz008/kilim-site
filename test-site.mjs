// Run with KILIM_PLAYWRIGHT_PATH pointing at an installed Playwright package.
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.KILIM_PLAYWRIGHT_PATH || 'playwright');
const root = path.dirname(fileURLToPath(import.meta.url));
const base = process.env.KILIM_SITE_URL || 'http://127.0.0.1:8768';
const output = path.join(root, 'verification');
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const context = await browser.newContext({ viewport: { width: 1440, height: 1050 }, reducedMotion: 'reduce' });
const page = await context.newPage();
const errors = [];
page.on('pageerror', error => errors.push(error.message));
page.on('response', response => { if (response.status() >= 400) errors.push(response.status() + ' ' + response.url()); });
try {
  await page.goto(base, { waitUntil: 'networkidle' });
  await page.locator('#patterns').scrollIntoViewIfNeeded();
  await page.waitForLoadState('networkidle');
  assert.ok(await page.locator('.swatches').evaluate(el => el.getBoundingClientRect().height < 450), 'compact gallery');
  await page.evaluate(() => scrollTo(0, 0));
  await page.screenshot({ path: path.join(output, 'homepage-desktop.png'), fullPage: true });
  await page.screenshot({ path: path.join(output, 'hero-desktop.png') });
  assert.equal(await page.locator('h1').count(), 1);
  await page.getByRole('button', { name: 'Folded', exact: true }).click();
  assert.match(await page.locator('#preview-rug').getAttribute('src'), /rug-fold/);
  await page.getByRole('button', { name: 'Rolled', exact: true }).click();
  assert.match(await page.locator('#preview-rug').getAttribute('src'), /rug-roll/);
  await page.getByRole('button', { name: 'Peek', exact: true }).click();
  assert.equal(await page.locator('#preview-rug').evaluate(el => getComputedStyle(el).opacity), '0.26');
  await page.getByRole('button', { name: 'Flat', exact: true }).click();
  await page.getByRole('button', { name: 'Move rug right' }).click();
  assert.equal(await page.locator('#preview-rug').evaluate(el => el.style.getPropertyValue('--rug-x')), '25px');
  await page.locator('#preview-rug').focus(); await page.keyboard.press('ArrowLeft');
  assert.equal(await page.locator('#preview-rug').evaluate(el => el.style.getPropertyValue('--rug-x')), '5px');
  await page.getByRole('button', { name: 'İznik', exact: true }).click();
  assert.equal(await page.locator('#pattern-title').textContent(), 'İznik');
  assert.match(await page.locator('#selected-pattern').getAttribute('src'), /theme-iznik/);
  assert.equal(await page.locator('[data-theme][aria-pressed="true"]').count(), 1);
  await page.locator('summary').first().click();
  assert.equal(await page.locator('details').first().getAttribute('open'), '');
  const download = await context.request.head(base + '/downloads/Kilim-Windows-0.1.0-beta-win-x64.zip');
  assert.equal(download.status(), 200); assert.equal(Number(download.headers()['content-length']), 68494869);
  const localLinks = await page.locator('a[href]').evaluateAll(links => [...new Set(links.map(a => a.getAttribute('href')).filter(h => !/^(https?:|#)/.test(h)))]);
  for (const href of localLinks) assert.equal((await context.request.head(new URL(href, base + '/').href)).status(), 200, href);
  for (const doc of ['help.html', 'releases.html', 'privacy.html', 'credits.html']) {
    await page.goto(base + '/' + doc, { waitUntil: 'networkidle' });
    assert.equal(await page.locator('h1').count(), 1, doc);
    assert.ok(await page.title(), doc);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, doc);
  }
  for (const width of [320, 390, 768]) {
    await page.setViewportSize({ width, height: 844 });
    for (const doc of ['', 'help.html', 'releases.html', 'privacy.html', 'credits.html']) {
      await page.goto(base + '/' + doc, { waitUntil: 'networkidle' });
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, width + 'px ' + doc);
    }
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(base, { waitUntil: 'networkidle' });
  await page.locator('#patterns').scrollIntoViewIfNeeded();
  await page.waitForLoadState('networkidle');
  await page.evaluate(() => scrollTo(0, 0));
  await page.screenshot({ path: path.join(output, 'homepage-mobile.png'), fullPage: true });
  await page.screenshot({ path: path.join(output, 'hero-mobile.png') });
  const unloaded = await page.locator('img').evaluateAll(images => images.filter(img => !img.loading || img.loading !== 'lazy').filter(img => !img.complete || img.naturalWidth === 0).map(img => img.src));
  assert.deepEqual(unloaded, []); assert.deepEqual(errors, []);
  const report = { passed: true, checks: ['desktop/mobile layout', 'five pages', 'preview states', 'peek opacity', 'keyboard movement', 'theme selection', 'FAQ', 'local link targets', 'actual download size', 'no browser errors', 'reduced motion context'] };
  await writeFile(path.join(output, 'report.json'), JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report));
} finally { await browser.close(); }
