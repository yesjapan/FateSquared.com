# fatesquared.com

Promotional site for **Fate Squared**, a novel by George Trombley (Sandspeck Press, 29 October 2026).

Static site — no build step, no dependencies. Three files plus assets:

```
index.html   content + structure
styles.css   design system + layout
script.js    reveal choreography, book flip, nav, optional audio player
assets/      cover images, author photo, OG image, favicon (see assets/README.md)
```

## Run it locally

Any static server works. From this folder:

```
npx serve .
# or
python -m http.server 8080
```

Opening `index.html` directly from disk also works (fonts load from Google Fonts).

## Before launch — checklist

1. ~~**Author photo**~~ — done: hi-res portrait in place. Covers, spine and the social-share image are all in place too (see [assets/README.md](assets/README.md)).
2. **Retailer links / pre-order** — the `<ul class="retailers">` list points at ISBN searches, and the `#buyNotice` block under it tells visitors the book is not on sale yet. **KDP does not offer pre-orders for paperback**, only for Kindle ebooks (set up in KDP with a release date up to a year out; the final manuscript must be uploaded by KDP's deadline before that date). So if a Kindle pre-order goes live, edit `#buyNotice` to point at it, and delete the block entirely once everything is orderable.

   The countdown above the list runs off `data-release="2026-10-29"` on `#countdown`. It counts to **local midnight**, and once the date passes it adds `is-released` to `<html>`, which hides both the clock and the notice and shows "Out now" — no edit needed on the day.
3. **Retailer links (detail)** — in `index.html`, the `<ul class="retailers">` list. They currently point at ISBN searches (`9781959949046`) on Amazon, Barnes & Noble and Bookshop.org, which resolve once the book is listed. Swap in direct product URLs when you have them; Apple Books and Kobo rows are there commented out.
3. ~~**Release date**~~ — done: **29 October 2026**, set in the hero meta, the "Get the book" copy, the social-card descriptions, `book:release_date`, and `datePublished` in the JSON-LD block.
4. **Notify-me list** — wired for **Kit** (kit.com, free to 10k subscribers). One-time setup:
   1. Create a Kit account for Fate Squared (keep it separate from the FromZero list).
   2. Verify a sending address on your domain — e.g. `george@fatesquared.com` — and add the SPF/DKIM DNS records Kit gives you. Forward that address to your real inbox so replies reach you.
   3. **Grow → Landing Pages & Forms → New form** (inline, any style — the site supplies its own design). Note the numeric form ID from the URL or embed code.
   4. In `index.html`, replace `YOUR_FORM_ID` in `<form id="notifyForm" action="https://app.kit.com/forms/YOUR_FORM_ID/subscriptions">`.
   5. In the form's settings, turn on double opt-in (recommended) and set the incentive/confirmation email copy.

   That single edit switches the whole site into "notify" mode: the hero CTA becomes **Notify me on release**, the nav gets a gold **Notify me** button, the buy section links to the list, and the section itself appears. Submissions post inline and show a "check your inbox" message. Until then everything falls back to **Get the book**.

   Using a different provider instead? Set the form `action` to their endpoint and rename the email input (`name="email_address"` for Kit; `name="email"` for Buttondown / most others). The comment above the form in `index.html` has the details.

   **On launch day**, after the release email goes out, swap the CTAs back by simply removing the `action` (or leaving the list up — up to you).
5. **Domain** — canonical + OG URLs assume `https://fatesquared.com/`. Update in `<head>` if the site lives elsewhere.

## Deploy

Hosted on **GitHub Pages** from the `main` branch of [github.com/yesjapan/FateSquared.com](https://github.com/yesjapan/FateSquared.com). Every push to `main` goes live at https://fatesquared.com within a minute or so.

- `CNAME` pins the custom domain (`fatesquared.com`); `.nojekyll` tells Pages to serve the files as-is.
- DNS at the registrar: four `A` records on the apex → `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153` (optionally the matching `AAAA` records), and a `CNAME` for `www` → `yesjapan.github.io`. GitHub redirects `www` → apex and issues the TLS certificate automatically once DNS resolves.

Workflow: edit → `git commit` → `git push`. Nothing to build.

## Cache busting

`index.html` links the stylesheet and script with a version query:

```html
<link rel="stylesheet" href="styles.css?v=3">
<script src="script.js?v=3" defer></script>
```

**Bump both numbers whenever you edit `styles.css` or `script.js`.** GitHub Pages
serves those files with `Cache-Control: max-age=14400`, so without the bump a
returning visitor keeps the old copy for up to four hours. The HTML itself is
only cached for 10 minutes, so a bumped version propagates quickly.

Images and fonts do not need this — replacing one means changing its filename.

If the site is behind the Cloudflare proxy, also purge the Cloudflare cache
(Caching → Configuration → Purge Everything) after a deploy, or move hosting to
Cloudflare Pages, where each deploy invalidates automatically.

## Design notes

Palette, type and motifs come straight off the jacket: indigo tower-glass grid, hot magenta, one gold doorway (used for the primary buttons and the notify frame). Display type is *Big Shoulders Display*, body is *Instrument Sans*. Everything respects `prefers-reduced-motion`.
