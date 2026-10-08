# Kilim for Windows — free website

The app is free. The app download URL is temporarily unset. App download buttons display “Download coming soon” and are disabled until a new link is provided. Checkout pages, provider configuration and in-app licence checks have been removed.

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

The previous app download URL has been removed from all six pages and the browser tests. Source and checksum downloads remain available. To restore app downloads, replace the disabled app buttons with the new confirmed URL and update the browser download checks and release metadata to match it.

## Prepare public hosting

```powershell
node .\prepare-publish.mjs
```

This copies site pages, visual assets, checksum and source to ../kilim-site-public, excluding app binaries, tests and development artifacts. The static site does not bundle the app ZIP; a new external download link will be provided later. No payment configuration is required. The Worker itself is unchanged by this local update.

No external hosting or app package was changed when removing the link.

## Verify

With the server running, point KILIM_PLAYWRIGHT_PATH at an installed Playwright package and run node test-site.mjs. Checks cover responsive layouts, preview/gallery controls, direct download navigation, download metadata and the public-site package.
