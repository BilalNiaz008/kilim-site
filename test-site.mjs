// Run with KILIM_PLAYWRIGHT_PATH pointing at an installed Playwright package.
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdir, writeFile, readdir, readFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.KILIM_PLAYWRIGHT_PATH || 'playwright');
const root = path.dirname(fileURLToPath(import.meta.url));
const base = process.env.KILIM_SITE_URL || 'http://127.0.0.1:8768';
const output = path.join(root, 'verification');
const checksumName = 'Kilim-Windows-0.3.0-beta-win-x64.zip.sha256';
const checksum = '80ac19fff99604bf2a44034d7eab832943f6b63f216e8c3d50e0c549d08857c6';
const checkout = 'https://buy.polar.sh/polar_cl_F4BVskVz9PYQ9hahNEYksDCf6VDmMh7gyivu70FzZcy';
const portal = 'https://polar.sh/suko-pro/portal';
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

  const video = page.locator('#desktop-video');
  assert.equal(await video.getAttribute('preload'), 'none', 'video waits for visitor interaction');
  assert.equal(await video.getAttribute('autoplay'), null, 'no autoplay');
  assert.equal(await video.evaluate(element => element.controls && element.playsInline), true, 'native controls and inline playback');
  await video.scrollIntoViewIfNeeded();
  await video.screenshot({ path: path.join(output, 'video-desktop.png') });
  await video.evaluate(element => element.load());
  await page.waitForFunction(() => document.querySelector('#desktop-video').readyState >= 2);
  assert.ok(Math.abs(await video.evaluate(element => element.duration) - 37.9) < 0.2, 'complete recording duration');
  assert.deepEqual(await video.evaluate(element => [element.videoWidth, element.videoHeight]), [1280, 720]);
  await video.evaluate(element => { element.muted = true; return element.play(); });
  await page.waitForFunction(() => document.querySelector('#desktop-video').currentTime > 0.25);
  assert.equal(await video.evaluate(element => element.error), null, 'browser decodes and plays video');
  await video.evaluate(element => element.pause());

  await page.route(checkout, route => route.fulfill({ status: 200, contentType: 'text/html', body: '<h1>Polar checkout destination</h1>' }));
  await page.locator('a[data-checkout]').first().click();
  assert.equal(page.url(), checkout, 'buy button opens the permanent Polar checkout');
  await page.unroute(checkout);

  for (const width of [1440, 768, 390, 320]) {
    await page.setViewportSize({ width, height: 900 });
    for (const doc of documents) {
      await page.goto(base + '/' + doc, { waitUntil: 'networkidle' });
      assert.equal(await page.locator('h1').count(), 1, doc);
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, width + 'px ' + doc);
      assert.doesNotMatch(await page.locator('body').innerText(), /Download coming soon|free beta|download the free|no account, payment|without online licence/i, doc);
      const purchases = page.getByRole('link', { name: 'Buy for $1', exact: true });
      assert.ok(await purchases.count(), 'purchase action on ' + doc);
      for (const button of await purchases.all()) {
        assert.equal(await button.getAttribute('href'), checkout, doc);
        assert.equal(await button.getAttribute('download'), null, 'checkout is navigation, not an app download');
      }
      const appLinks = await page.locator('a[href]').evaluateAll(links => links.map(link => link.getAttribute('href')).filter(href => /-win-x64\.zip(?:$|[?#])/i.test(href)));
      assert.deepEqual(appLinks, [], 'no active app download on ' + doc);
      assert.doesNotMatch(await page.locator('body').innerText(), /0\.[12]\.0/, 'paid version on ' + doc);
      if (['index.html', 'download.html', 'help.html'].includes(doc)) assert.match(await page.locator('body').innerText(), /30 minutes/);
      const links = await page.locator('a[href]').evaluateAll(items => [...new Set(items.map(a => a.getAttribute('href')).filter(h => !/^(https?:|mailto:|#)/.test(h)))]);
      if (width === 1440) for (const href of links) assert.equal((await context.request.head(new URL(href, base + '/').href)).status(), 200, href);
    }
  }
  await page.goto(base + '/download.html', { waitUntil: 'networkidle' });
  assert.equal(await page.getByRole('link', { name: 'Open your Polar purchases', exact: true }).getAttribute('href'), portal);
  assert.match(await page.locator('body').innerText(), /US\$1 once/);
  const checksumResponse = await context.request.get(base + '/downloads/' + checksumName);
  assert.equal(checksumResponse.status(), 200);
  assert.equal((await checksumResponse.text()).trim(), checksum + '  Kilim-Windows-0.3.0-beta-win-x64.zip');
  const noJs = await browser.newContext({ javaScriptEnabled: false });
  const noJsPage = await noJs.newPage();
  await noJsPage.goto(base + '/download.html');
  assert.equal(await noJsPage.getByRole('link', { name: 'Buy for $1', exact: true }).last().getAttribute('href'), checkout, 'checkout works without JavaScript');
  await noJsPage.goto(base + '/index.html');
  assert.equal(await noJsPage.locator('#desktop-video').getAttribute('controls'), '', 'video controls work without site JavaScript');
  await noJs.close();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(base, { waitUntil: 'networkidle' });
  await page.locator('#patterns').scrollIntoViewIfNeeded();
  await page.waitForLoadState('networkidle'); await page.evaluate(() => scrollTo(0, 0));
  await page.screenshot({ path: path.join(output, 'homepage-mobile.png'), fullPage: true });
  await page.screenshot({ path: path.join(output, 'hero-mobile.png') });
  await page.locator('#desktop-video').scrollIntoViewIfNeeded();
  await page.locator('#desktop-video').screenshot({ path: path.join(output, 'video-mobile.png') });
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
  assert.ok(publicDownloads.includes(checksumName), 'current release checksum published');
  assert.equal((await readFile(path.join(publicRoot, 'CNAME'), 'utf8')).trim(), 'kilimwindow.online', 'custom domain preserved');
  assert.equal((await readFile(path.join(publicRoot, 'assets/kilim-demo.mp4'))).length, (await readFile(path.join(root, 'assets/kilim-demo.mp4'))).length, 'video included in publication');
  assert.ok((await readFile(path.join(publicRoot, 'assets/kilim-demo-poster.webp'))).length > 0, 'poster included in publication');
  const report = { passed: true, checks: ['six responsive pages', 'preview/gallery/keyboard controls', 'video decoding and playback', 'video controls, poster and mobile layout', 'permanent Polar checkout navigation', 'returning buyer portal', 'purchase links work without JavaScript', 'paid copy and activation requirements', 'static publication includes demo video and excludes app binaries', '0.3.0 source and checksum links', 'custom domain preserved', 'no browser errors'], livePaymentOrActivationTested: false };
  await writeFile(path.join(output, 'report.json'), JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report));
} finally { await browser.close(); }
