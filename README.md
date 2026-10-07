# Kilim for Windows — product website

A local, responsive five-page website and design proposal. The demo uses real Windows app test renders; it is a preview rather than an in-browser cloth simulation.

## Preview locally

From this folder, start a static server:

```powershell
python -m http.server 8768 --bind 127.0.0.1
```

Open `http://127.0.0.1:8768`. No npm install, framework, backend or build step is required. You can also open `index.html` directly.

## Files

- `index.html`: product landing page, accessible interactive demo, 15-pattern gallery, download and FAQ.
- `help.html`: setup, controls, troubleshooting, removal and checksum verification.
- `releases.html`: real 0.1.0 release features, known limits and test scope.
- `privacy.html`: local app behaviour and this site's lack of analytics/forms.
- `credits.html`: original author, independent adaptation, MIT licence and source.
- `styles.css` / `site.js`: shared responsive design and native interactions.
- `design-brief.md`: complete design, copy, site structure, hosting and launch plan.
- `downloads/`: actual locally available app/source/checksum, included for testing.

## Before public deployment

Upload the Windows app archive and source to a release repository you own. Replace links under `downloads/` with those release URLs. This app's 65.3 MiB ZIP exceeds Cloudflare Pages' 25 MiB per-file limit, so deploy only the site files/assets there. The `downloads/` folder is for the local preview, not a Cloudflare Pages upload.

Add the real domain's canonical URL, absolute Open Graph image URL and sitemap after choosing the domain. Choose a public support channel and link it from Help. Code signing and more Windows-PC compatibility testing are distribution improvements; the current beta disclosure must remain until those are actually completed.

No public site, domain or release repository was created by this task.
