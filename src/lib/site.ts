/**
 * Central site configuration: canonical metadata + every external link.
 * The mockup's href="#" placeholders are stubs — these are the real targets.
 */

export const SITE = {
  name: 'EternalRichPresence',
  /** Short tagline used in <title> suffixes and OG site_name. */
  shortName: 'EternalRichPresence',
  tagline: "What you're listening to, live on Discord.",
  description:
    'EternalRichPresence mirrors Apple Music and Spotify to your Discord profile — real cover art, accurate progress, and Listen Along. A lightweight Windows tray app that stays out of your way.',
  author: 'whoisaldo',
  /** Production origin — also set as `site` in astro.config.mjs for absolute URLs. */
  origin: 'https://eternalrichpresence.vercel.app',
  ogImage: '/og.png',
} as const;

export const LINKS = {
  github: 'https://github.com/whoisaldo/Eternal-Rich-Presence',
  issues: 'https://github.com/whoisaldo/Eternal-Rich-Presence/issues',
  /** Contributing guide points at the repo for now. */
  contributing: 'https://github.com/whoisaldo/Eternal-Rich-Presence',
  discord: 'https://discord.gg/meuQXb8vZ3',
  discordDevPortal: 'https://discord.com/developers/applications',
  releasesApi:
    'https://api.github.com/repos/whoisaldo/Eternal-Rich-Presence/releases',
  appleChart:
    'https://rss.applemarketingtools.com/api/v2/us/music/most-played/25/songs.json',
} as const;

/** Internal routes. */
export const ROUTES = {
  home: '/',
  releases: '/releases',
  setup: '/setup',
  /** Anchor for the SmartScreen / SHA-256 verification explainer (on /setup). */
  verify: '/setup#smartscreen',
} as const;
