// Run with KILIM_PLAYWRIGHT_PATH pointing at an installed Playwright package.
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdir, writeFile, readdir } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.KILIM_PLAYWRIGHT_PATH || 'playwright');
const root = path.dirname(fileURLToPath(import.meta.url));
const base = process.env.KILIM_SITE_URL || 'http://127.0.0.1:8768';
const output = path.join(root, 'verification');
const checksumName = 'Kilim-Windows-0.1.0-beta-win-x64.zip.sha256';
const documents = ['index.html', 'download.html', 'help.html', 'releases.html', 'privacy.html', 'credits.html'];
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const context = await browser.newContext({ viewport: { width: 1440, height: 1050 }, reducedMotion: 'reduce', acceptDownloads: true });
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
  assert.equal(await page.locator('[data-theme][aria-pressed="true"]').count(), 1);
  await page.locator('summary').first().click();
  assert.equal(await page.locator('details').first().getAttribute('open'), '');

  assert.equal((await context.request.head(base + '/purchase.html')).status(), 404, 'checkout page removed');
  assert.equal((await context.request.head(base + '/polar-config.mjs')).status(), 404, 'provider config removed');

  for (const width of [1440, 768, 390, 320]) {
    await page.setViewportSize({ width, height: 900 });
    for (const doc of documents) {
      await page.goto(base + '/' + doc, { waitUntil: 'networkidle' });
      assert.equal(await page.locator('h1').count(), 1, doc);
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, width + 'px ' + doc);
      assert.doesNotMatch(await page.locator('body').innerText(), /Polar|Buy for|\$1|one-time purchase/i, doc);
      const placeholders = page.getByRole('button', { name: 'Download coming soon', exact: true });
      assert.ok(await placeholders.count(), 'download status on ' + doc);
      for (const button of await placeholders.all()) assert.equal(await button.isDisabled(), true, doc);
      const appLinks = await page.locator('a[href]').evaluateAll(links => links.map(link => link.getAttribute('href')).filter(href => /-win-x64\.zip(?:$|[?#])/i.test(href)));
      assert.deepEqual(appLinks, [], 'no active app download on ' + doc);
      assert.doesNotMatch(await page.locator('body').innerText(), /0\.2\.0/, 'hosted version on ' + doc);
      const links = await page.locator('a[href]').evaluateAll(items => [...new Set(items.map(a => a.getAttribute('href')).filter(h => !/^(https?:|#)/.test(h)))]);
      if (width === 1440) for (const href of links) assert.equal((await context.request.head(new URL(href, base + '/').href)).status(), 200, href);
    }
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(base, { waitUntil: 'networkidle' });
  await page.locator('#patterns').scrollIntoViewIfNeeded();
  await page.waitForLoadState('networkidle'); await page.evaluate(() => scrollTo(0, 0));
  await page.screenshot({ path: path.join(output, 'homepage-mobile.png'), fullPage: true });
  await page.screenshot({ path: path.join(output, 'hero-mobile.png') });
  assert.deepEqual(errors, []);

  const built = spawnSync(process.execPath, [path.join(root, 'prepare-publish.mjs')], { encoding: 'utf8' });
  assert.equal(built.status, 0, built.stderr);
  const publicRoot = path.resolve(root, '../kilim-site-public');
  const files = await readdir(publicRoot);
  assert.equal(files.includes('purchase.html'), false);
  assert.equal(files.includes('polar-config.mjs'), false);
  assert.equal(files.includes('test-site.mjs'), false);
  const publicDownloads = await readdir(path.join(publicRoot, 'downloads'));
  assert.equal(publicDownloads.some(name => /win-x64\.zip$/.test(name)), false, 'static site does not bundle app binaries');
  assert.ok(publicDownloads.includes(checksumName), 'release checksum retained');
  const report = { passed: true, checks: ['six responsive pages', 'preview/gallery/keyboard controls', 'download placeholders disabled', 'no active app download URL', 'checkout and provider config removed', 'static publication excludes app binaries', 'source and checksum links retained', 'no browser errors'] };
  await writeFile(path.join(output, 'report.json'), JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report));
} finally { await browser.close(); }
