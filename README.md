# Kilim for Windows — $1 purchase website

The site sells the licensed 0.3.0 beta for US$1 once. All **Buy for $1** buttons navigate directly to the permanent Polar Checkout Link:

https://buy.polar.sh/polar_cl_F4BVskVz9PYQ9hahNEYksDCf6VDmMh7gyivu70FzZcy

Returning buyers get their ZIP and key at https://polar.sh/suko-pro/portal. Polar handles payment, customer sign-in and protected file delivery; this static site does not verify payments or host the paid app binary. No API token, embedded checkout or backend is needed. The links work without JavaScript.

The product requires one licence activation per PC and Windows user. Internet is required at activation, every launch and checks every 30 minutes. The site explains deactivation and transfers, including that forgetting a local key does not release the Polar slot.

## Design

The approved theme is Linen and indigo: warm linen backgrounds, deep blue text/actions and small rosewood details. Bricolage Grotesque is bundled locally under the SIL Open Font License for display headings; body copy uses system fonts. The hero is an illustrated Windows monitor with a centered taskbar and nine clustered sample files. A single entrance sequence shows the clutter before the rug covers it; Replay cover repeats the demonstration, and Peek reveals the retained files. Dragging lifts and tilts the preview, then settles on release. Reduced-motion preferences show the covered still and disable animations. The browser preview uses app-rendered images, not a browser cloth simulation.

The sample file and folder icons remain fixed as decorative desktop clutter. Visitors can move the rug, use Peek to reveal the cluster, and replay the covering demonstration. The preview never accesses or moves actual files.

## Preview locally

```powershell
python -m http.server 8768 --bind 127.0.0.1
```

Open http://127.0.0.1:8768. The site JavaScript provides the optional rug preview and pattern selection. The Google Analytics tag described below also runs on these pages. The homepage embeds a 38-second desktop demonstration with native playback controls and a poster image. It does not autoplay or preload the video; visitors choose when to load and play it. The video has no sound and includes a text description.

## Google Analytics

All six HTML pages include the provided Google tag for measurement ID `G-TPDNTJCHD7` once in the head. It loads asynchronously and initializes the default GA4 configuration. The privacy page describes analytics and first-party cookies. No custom purchase tracking or Polar payment events were added.

The same tag runs in local previews. Browser tests intercept the Google loader, verify initialization, and do not send test visits to Google. Confirm receipt in Google Analytics Realtime after deploying; the automated checks do not access your Analytics account.

## Search and sharing

All six pages have unique titles/descriptions, absolute HTTPS canonical URLs, social-sharing metadata and JSON-LD page identity. The homepage describes the actual Windows application and US$1 offer; supporting pages include breadcrumbs. No ratings, reviews or search-volume claims are fabricated. Google's software-app rich results require a real rating or review, so this markup does not claim eligibility for that presentation.

robots.txt allows crawling and points to sitemap.xml, which lists the six canonical pages. Update lastmod only when a page receives a significant change. vercel.json permanently redirects /index.html to /; internal home links use the root. The local Python server does not implement Vercel redirects, so the redirect must be checked after deployment. The share image reflects the paid Linen and indigo site.

After deploying, verify https://kilimwindow.online/ in Google Search Console, submit https://kilimwindow.online/sitemap.xml and use URL Inspection to check indexing. Search Console ownership and indexing cannot be verified by the local test suite. SEO changes help crawlers understand the site; they do not guarantee indexing, rich results or rankings.

## Pages

- index.html: app preview, desktop demonstration video, patterns, $1 purchase, activation requirements and FAQs.
- download.html: checkout, returning-buyer portal and extraction/activation steps.
- help.html: setup, licence transfers, controls, troubleshooting and removal.
- releases.html: 0.3.0 ZIP size, SHA-256, actual test scope and known limits.
- privacy.html: local desktop data, protected credentials, Polar licence requests and website Google Analytics.
- credits.html: original author, MIT attribution and the current editable source.

The shipped ZIP is Kilim-Windows-0.3.0-beta-win-x64.zip, 68,521,073 bytes. Its checksum is published under downloads; the app itself is delivered by the product's Polar File Downloads benefit. Both the download benefit and License Keys benefit must remain attached to the product.

## Prepare public hosting

```powershell
node .\prepare-publish.mjs
```

This copies the six pages, visual assets, demo video and poster, robots.txt, sitemap.xml, Vercel configuration, 0.3.0 checksum, MIT source archive, licence and CNAME to ../kilim-site-public. It excludes app binaries, tests and development artifacts. The existing custom domain is kilimwindow.online.

## Verify

With the server running, point KILIM_PLAYWRIGHT_PATH at an installed Playwright package and run node test-site.mjs. The suite checks six responsive pages, interactive controls, checkout navigation, the returning-buyer link, links without JavaScript, release metadata and the publication directory.

Checkout navigation is intercepted in the browser test; no payment is submitted. Real Polar activation, second-PC denial and device transfers need a separate end-to-end test before sales. No external hosting or app package is modified by preparing this site.
