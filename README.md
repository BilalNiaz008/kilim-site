# Kilim for Windows — free website

The app is free. The site offers a direct ZIP download with no account, payment or activation key. Checkout pages, provider configuration and in-app licence checks have been removed.

## Preview locally

```powershell
python -m http.server 8768 --bind 127.0.0.1
```

Open http://127.0.0.1:8768. The homepage preview is optional JavaScript; downloads and help work without it. No backend or framework is required.

## Pages

- index.html: app preview, pattern gallery and free download.
- download.html: direct ZIP, compatibility and extraction steps.
- help.html: setup, controls, troubleshooting and removal.
- releases.html: version, checksum and known limitations.
- privacy.html: the app operates locally without payment or licence-network requests.
- credits.html: original author, MIT notices and editable source.

The app buttons point directly to the public Cloudflare download:

https://kilim-windows-download.suko-app.workers.dev/download/Kilim-Windows-0.1.0-beta-win-x64.zip

The website displays the hosted beta 0.1.0, 68,494,869-byte package and its verified SHA-256. The downloads folder supplies the matching checksum and editable source. Local 0.2.0 app archives remain available for development but are not the version advertised by these buttons.

## Prepare public hosting

```powershell
node .\prepare-publish.mjs
```

This copies site pages, visual assets, checksum and source to ../kilim-site-public, excluding app binaries, tests and development artifacts. The ZIP is hosted by the existing Cloudflare Worker/R2 URL, so the static website no longer needs to ship the large app file. No payment configuration is required. The Worker itself is unchanged by this local update.

The website now intentionally links to the hosted 0.1.0 beta. No external site or payment provider was modified here.

## Verify

With the server running, point KILIM_PLAYWRIGHT_PATH at an installed Playwright package and run node test-site.mjs. Checks cover responsive layouts, preview/gallery controls, direct download navigation, download metadata and the public-site package.
