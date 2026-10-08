# Kilim for Windows — $1 purchase website

The site sells the licensed 0.3.0 beta for US$1 once. All **Buy for $1** buttons navigate directly to the permanent Polar Checkout Link:

https://buy.polar.sh/polar_cl_F4BVskVz9PYQ9hahNEYksDCf6VDmMh7gyivu70FzZcy

Returning buyers get their ZIP and key at https://polar.sh/suko-pro/portal. Polar handles payment, customer sign-in and protected file delivery; this static site does not verify payments or host the paid app binary. No API token, embedded checkout or backend is needed. The links work without JavaScript.

The product requires one licence activation per PC and Windows user. Internet is required at activation, every launch and checks every 30 minutes. The site explains deactivation and transfers, including that forgetting a local key does not release the Polar slot.

## Preview locally

```powershell
python -m http.server 8768 --bind 127.0.0.1
```

Open http://127.0.0.1:8768. JavaScript provides the optional rug preview and pattern selection only.

## Pages

- index.html: app preview, patterns, $1 purchase, activation requirements and FAQs.
- download.html: checkout, returning-buyer portal and extraction/activation steps.
- help.html: setup, licence transfers, controls, troubleshooting and removal.
- releases.html: 0.3.0 ZIP size, SHA-256, actual test scope and known limits.
- privacy.html: local desktop data, protected credentials and Polar licence requests.
- credits.html: original author, MIT attribution and the current editable source.

The shipped ZIP is Kilim-Windows-0.3.0-beta-win-x64.zip, 68,521,073 bytes. Its checksum is published under downloads; the app itself is delivered by the product's Polar File Downloads benefit. Both the download benefit and License Keys benefit must remain attached to the product.

## Prepare public hosting

```powershell
node .\prepare-publish.mjs
```

This copies the six pages, visual assets, 0.3.0 checksum, MIT source archive, licence and CNAME to ../kilim-site-public. It excludes app binaries, tests and development artifacts. The existing custom domain is kilimwindow.online.

## Verify

With the server running, point KILIM_PLAYWRIGHT_PATH at an installed Playwright package and run node test-site.mjs. The suite checks six responsive pages, interactive controls, checkout navigation, the returning-buyer link, links without JavaScript, release metadata and the publication directory.

Checkout navigation is intercepted in the browser test; no payment is submitted. Real Polar activation, second-PC denial and device transfers need a separate end-to-end test before sales. No external hosting or app package is modified by preparing this site.
