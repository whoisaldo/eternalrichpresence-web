# EternalRichPresence — website

Marketing site for [EternalRichPresence](https://github.com/whoisaldo/Eternal-Rich-Presence),
the Discord Rich Presence bridge for Apple Music + Spotify.

Built with [Astro](https://astro.build) as a fully static site (SSG) — no server
runtime, deploys anywhere (target: Vercel).

## Pages

- `/` — landing (hero presence card, downloads, features, setup, contributing)
- `/releases` — changelog, read live from GitHub Releases
- `/setup` — full setup guide + a "why is Windows flagging it / verify the
  SHA-256" explainer

## Build-time data (no client-side fetches → no CORS)

Both data sources are fetched in Astro frontmatter at **build time**:

- **Apple Music chart** — the hero card's rotation set comes from the
  [Apple "Most Played" RSS feed](https://rss.applemarketingtools.com/api/v2/us/music/most-played/25/songs.json).
  The client only cycles the embedded set visually (no audio). Falls back to a
  hardcoded set if the fetch fails. See `src/lib/apple.ts`.
- **GitHub Releases** — version, notes, download asset, and the SHA-256 checksum
  are read from the [Releases API](https://api.github.com/repos/whoisaldo/Eternal-Rich-Presence/releases).
  Nothing is hardcoded; if there are no releases yet it shows a "coming soon"
  state. See `src/lib/github.ts`.

> Release notes are rendered **verbatim** from GitHub — edit them on the release
> to change what the site shows.

## Develop

```bash
npm install
npm run dev        # local dev server
npm run build      # static build → dist/
npm run preview    # serve the build locally
```

An optional `GITHUB_TOKEN` env var raises the GitHub API rate limit during the
build (handy on CI); unauthenticated requests work fine for local builds.

## Assets

`npm run gen:assets` regenerates the social/icon rasters with
[`@resvg/resvg-js`](https://github.com/yisibl/resvg-js):

- `public/og.png` (1200×630) — the red hero used for Open Graph / Twitter
- `public/apple-touch-icon.png`, `public/favicon-32.png`, `public/favicon-16.png`

The generated PNGs are committed, so a normal build never runs this script.
`public/favicon.svg` is the source glyph.

## Project layout

```
src/
  layouts/Base.astro        # <html> shell + <BaseHead>
  components/
    BaseHead.astro          # SEO + Open Graph + Twitter meta, fonts, favicons
    Nav, Hero, PresenceCard, Releases, Features, Setup, Contributing, Footer
    Icon.astro              # inline SVG icon set
  lib/
    site.ts                 # canonical metadata + every external link
    apple.ts, github.ts     # build-time data
  styles/global.css         # design-reference CSS, ported verbatim (+ page CSS)
  pages/                     # index, releases, setup
```

## Deploy

Static — output is `dist/`. For Vercel, the framework preset is **Astro** with
no extra config. Set the production domain as `site` in `astro.config.mjs` so
canonical URLs, the sitemap, and OG image URLs resolve absolutely.
