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
const analyticsId = 'G-TPDNTJCHD7';
const analyticsUrl = 'https://www.googletagmanager.com/gtag/js?id=' + analyticsId;
const documents = ['index.html', 'download.html', 'help.html', 'releases.html', 'privacy.html', 'credits.html'];
const siteOrigin = 'https://kilimwindow.online';
const canonicalUrls = documents.map(doc => siteOrigin + (doc === 'index.html' ? '/' : '/' + doc));
const searchTitles = new Set(), searchDescriptions = new Set();
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const context = await browser.newContext({ viewport: { width: 1440, height: 1050 }, reducedMotion: 'reduce', acceptDownloads: true });
const analyticsRequests = [];
// Intercept Google so automated checks do not add visits to production analytics.
await context.route('https://www.googletagmanager.com/gtag/js?*', route => {
  analyticsRequests.push(route.request().url());
  return route.fulfill({ status: 200, contentType: 'application/javascript', body: '' });
});
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
  await page.getByRole('button', { name: 'Flat', exact: true }).click();
  assert.equal(await page.locator('.desktop-file').count(), 9, 'a real file cluster beneath the rug');
  assert.equal(await page.locator('#preview-rug').evaluate(el => el.getAnimations().length), 0, 'reduced motion shows the covered still');
  const clusterCovered = await page.evaluate(async () => {
    const image = document.querySelector('#preview-rug'); await image.decode();
    const canvas = document.createElement('canvas'); canvas.width = image.naturalWidth; canvas.height = image.naturalHeight;
    const ctx = canvas.getContext('2d'); ctx.drawImage(image, 0, 0);
    const rugBounds = image.getBoundingClientRect();
    return [...document.querySelectorAll('.desktop-file .file-icon')].every(icon => {
      const bounds = icon.getBoundingClientRect();
      const x = Math.floor((bounds.x + bounds.width / 2 - rugBounds.x) * image.naturalWidth / rugBounds.width);
      const y = Math.floor((bounds.y + bounds.height / 2 - rugBounds.y) * image.naturalHeight / rugBounds.height);
      return x >= 0 && y >= 0 && x < canvas.width && y < canvas.height && ctx.getImageData(x, y, 1, 1).data[3] > 245;
    });
  });
  assert.equal(clusterCovered, true, 'all nine file icons sit beneath opaque rug artwork');
  const desktop = await page.locator('.desktop').boundingBox();
  const grabX = desktop.x + desktop.width * .55, grabY = desktop.y + desktop.height * .55;
  await page.mouse.move(grabX, grabY); await page.mouse.down();
  assert.equal(await page.locator('#preview-rug').evaluate(el => el.classList.contains('dragging')), true, 'rug lifts while grabbed');
  await page.mouse.move(grabX + 40, grabY + 25, { steps: 4 });
  assert.ok(await page.locator('#preview-rug').evaluate(el => parseFloat(el.style.getPropertyValue('--rug-x')) > 30), 'pointer drag moves rug');
  await page.mouse.up();
  assert.equal(await page.locator('#preview-rug').evaluate(el => el.classList.contains('dragging')), false, 'rug settles on release');
  assert.equal(await page.locator('#preview-rug').evaluate(el => el.style.getPropertyValue('--rug-tilt')), '0deg');
  assert.equal(await page.locator('#preview-rug').evaluate(el => getComputedStyle(el).animationName), 'none', 'reduced motion disables entrance');
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.getByRole('button', { name: 'Replay covering the files', exact: true }).click();
  assert.equal(await page.locator('[data-desktop-caption]').textContent(), 'A familiar kind of clutter.');
  assert.ok(await page.locator('#preview-rug').evaluate(el => el.getAnimations().length > 0), 'cover animation starts on replay');
  await page.locator('.desktop').screenshot({ path: path.join(output, 'desktop-before-cover.png') });
  await page.waitForFunction(() => document.querySelector('[data-desktop-caption]').textContent === 'Covered, not deleted.');
  await page.locator('.desktop').screenshot({ path: path.join(output, 'desktop-covered.png') });
  assert.equal(await page.locator('.desktop-file').count(), 9, 'covering retains the files');
  await page.getByRole('button', { name: 'Peek', exact: true }).click();
  await page.waitForFunction(() => Math.abs(Number(getComputedStyle(document.querySelector('#preview-rug')).opacity) - .26) < .01);
  await page.getByRole('button', { name: 'Flat', exact: true }).click();
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.getByRole('button', { name: 'Replay covering the files', exact: true }).click();
  assert.equal(await page.locator('#preview-rug').evaluate(el => el.getAnimations().length), 0, 'replay respects reduced motion');
  assert.equal(await page.getByRole('button', { name: 'Move files', exact: true }).count(), 0, 'icon movement control removed');
  assert.equal(await page.getByRole('button', { name: 'Reset files', exact: true }).count(), 0, 'icon reset control removed');
  assert.equal(await page.locator('button.desktop-file, [data-system-icon]').count(), 0, 'sample icons are decorative');
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
      assert.equal(await page.locator('body').evaluate(el => getComputedStyle(el).backgroundColor), 'rgb(245, 240, 230)', 'Linen palette on ' + doc);
      if (width === 1440) {
        const canonical = canonicalUrls[documents.indexOf(doc)];
        assert.equal(await page.locator('link[rel="canonical"]').count(), 1, 'one canonical per page');
        assert.equal(await page.locator('link[rel="canonical"]').getAttribute('href'), canonical, doc);
        const searchTitle = await page.title();
        const searchDescription = await page.locator('meta[name="description"]').getAttribute('content');
        assert.ok(searchTitle.includes('Kilim for Windows'), doc);
        assert.ok(searchDescription.length > 80, 'descriptive search snippet');
        searchTitles.add(searchTitle); searchDescriptions.add(searchDescription);
        assert.equal(await page.locator('meta[property="og:url"]').getAttribute('content'), canonical);
        assert.equal(await page.locator('meta[property="og:title"]').getAttribute('content'), searchTitle);
        assert.equal(await page.locator('meta[property="og:image"]').getAttribute('content'), siteOrigin + '/assets/social-preview.png');
        assert.equal(await page.locator('meta[name="twitter:card"]').getAttribute('content'), 'summary_large_image');
        assert.doesNotMatch(await page.locator('meta[name="robots"]').getAttribute('content'), /noindex|nofollow/);
        const structured = JSON.parse(await page.locator('script[type="application/ld+json"]').textContent());
        assert.equal(structured['@context'], 'https://schema.org');
        assert.ok(structured['@graph'].some(node => node['@type'] === 'WebPage' && node.url === canonical));
        if (doc === 'index.html') {
          const app = structured['@graph'].find(node => node['@type'] === 'SoftwareApplication');
          assert.equal(app.operatingSystem, 'Windows 10, Windows 11');
          assert.equal(app.softwareVersion, '0.3.0-beta');
          assert.equal(app.offers.price, '1.00'); assert.equal(app.offers.priceCurrency, 'USD');
          assert.equal(app.offers.url, checkout);
          assert.equal(app.aggregateRating, undefined, 'no invented reviews or ratings');
        } else {
          const crumbs = structured['@graph'].find(node => node['@type'] === 'BreadcrumbList');
          assert.equal(crumbs.itemListElement.length, 2);
          assert.equal(crumbs.itemListElement[1].item, canonical);
        }
        const analyticsTag = page.locator('head script[src^="https://www.googletagmanager.com/gtag/js"]');
        assert.equal(await analyticsTag.count(), 1, 'one Google tag in ' + doc);
        assert.equal(await analyticsTag.getAttribute('src'), analyticsUrl, doc);
        assert.equal(await analyticsTag.evaluate(element => element.async), true, 'async Google tag');
        const analyticsCommands = await page.evaluate(() => window.dataLayer.map(command => Array.from(command)));
        assert.equal(analyticsCommands.filter(command => command[0] === 'js').length, 1, doc);
        assert.deepEqual(analyticsCommands.filter(command => command[0] === 'config'), [['config', analyticsId]], doc);
      }
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, width + 'px ' + doc);
      if (doc === 'index.html') {
        assert.equal(await page.locator('.desktop-file').count(), 9, 'sample files retained at ' + width + 'px');
        assert.equal(await page.evaluate(() => {
          const top = document.querySelector('.desktop-bar').getBoundingClientRect().top;
          return [...document.querySelectorAll('.desktop-file')].every(file => file.getBoundingClientRect().bottom <= top);
        }), true, 'file cluster clears the taskbar at ' + width + 'px');
      }
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
  assert.equal(searchTitles.size, documents.length, 'unique search titles');
  assert.equal(searchDescriptions.size, documents.length, 'unique search descriptions');
  const robotsResponse = await context.request.get(base + '/robots.txt');
  assert.equal(robotsResponse.status(), 200);
  assert.match(await robotsResponse.text(), /Sitemap: https:\/\/kilimwindow\.online\/sitemap\.xml/);
  assert.doesNotMatch(await robotsResponse.text(), /Disallow:\s*\/(?:\s|$)/);
  const sitemapResponse = await context.request.get(base + '/sitemap.xml');
  assert.equal(sitemapResponse.status(), 200);
  const sitemapUrls = await page.evaluate(xml => {
    const sitemap = new DOMParser().parseFromString(xml, 'application/xml');
    if (sitemap.querySelector('parsererror')) throw new Error('Invalid sitemap XML');
    return [...sitemap.querySelectorAll('loc')].map(node => node.textContent);
  }, await sitemapResponse.text());
  assert.deepEqual(sitemapUrls, canonicalUrls);
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
  assert.ok(analyticsRequests.length >= documents.length, 'Google tag requested across the site');
  assert.ok(analyticsRequests.every(url => url === analyticsUrl), 'all pages load the provided measurement ID');

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
  assert.ok((await readFile(path.join(publicRoot, 'assets/bricolage-grotesque-latin.woff2'))).length > 0, 'local display font published');
  for (const seoFile of ['robots.txt', 'sitemap.xml', 'vercel.json']) {
    assert.equal(await readFile(path.join(publicRoot, seoFile), 'utf8'), await readFile(path.join(root, seoFile), 'utf8'), 'SEO file published: ' + seoFile);
  }
  const hosting = JSON.parse(await readFile(path.join(publicRoot, 'vercel.json'), 'utf8'));
  assert.deepEqual(hosting.redirects, [{ source: '/index.html', destination: '/', permanent: true }]);
  assert.match(await readFile(path.join(publicRoot, 'assets/bricolage-grotesque-OFL.txt'), 'utf8'), /SIL OPEN FONT LICENSE/);
  for (const doc of documents) {
    const publishedPage = await readFile(path.join(publicRoot, doc), 'utf8');
    assert.equal(publishedPage.split(analyticsUrl).length - 1, 1, 'one published Google tag in ' + doc);
  }
  const report = { passed: true, checks: ['six responsive Linen and indigo pages', 'unique search titles and descriptions', 'HTTPS canonicals and absolute social images', 'truthful website and software structured data', 'breadcrumb structured data', 'crawlable robots file and six-URL XML sitemap', 'Vercel homepage canonical redirect configuration', 'Windows desktop and static nine-file cluster', 'icon movement controls removed', 'rug artwork physically covers file icons', 'cover replay retains files and respects reduced motion', 'Google Analytics tag and initialization once per page', 'analytics requests intercepted during tests', 'preview/gallery/keyboard controls', 'pointer lift, drag and settling', 'peek after animation and reduced motion', 'video decoding and playback', 'video controls, poster and mobile layout', 'permanent Polar checkout navigation', 'returning buyer portal', 'purchase links work without JavaScript', 'paid copy and activation requirements', 'static publication includes SEO files and demo video, excludes app binaries', 'local display font and OFL notice', '0.3.0 source and checksum links', 'custom domain preserved', 'no browser errors'], googleSearchConsoleVerified: false, liveCanonicalRedirectVerified: false, googleAnalyticsRealtimeVerified: false, livePaymentOrActivationTested: false };
  await writeFile(path.join(output, 'report.json'), JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report));
} finally { await browser.close(); }
