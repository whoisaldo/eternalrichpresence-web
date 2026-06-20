/**
 * Generates the static raster assets that have to be PNG for social unfurls and
 * iOS/Windows icons (Discord, Twitter, etc. won't reliably render an SVG OG):
 *
 *   public/og.png              1200x630  red hero, brand + tagline + card
 *   public/apple-touch-icon.png 180x180  brand glyph
 *   public/favicon-32.png        32x32   brand glyph
 *   public/favicon-16.png        16x16   brand glyph
 *
 * Run once with `npm run gen:assets`; the PNGs are committed so a normal
 * `astro build` never needs this script (or a network connection). Brand fonts
 * are fetched from Google Fonts (OFL) into scripts/fonts/ on demand.
 */
import { Resvg } from '@resvg/resvg-js';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const PUBLIC = join(ROOT, 'public');
const FONT_DIR = join(__dirname, 'fonts');

const FONTS = [
  {
    file: 'SpaceGrotesk.ttf',
    url: 'https://raw.githubusercontent.com/google/fonts/main/ofl/spacegrotesk/SpaceGrotesk%5Bwght%5D.ttf',
  },
  {
    file: 'Inter.ttf',
    url: 'https://raw.githubusercontent.com/google/fonts/main/ofl/inter/Inter%5Bopsz%2Cwght%5D.ttf',
  },
];

async function ensureFonts() {
  if (!existsSync(FONT_DIR)) mkdirSync(FONT_DIR, { recursive: true });
  const paths = [];
  for (const f of FONTS) {
    const p = join(FONT_DIR, f.file);
    if (!existsSync(p)) {
      process.stdout.write(`Fetching ${f.file}… `);
      const res = await fetch(f.url);
      if (!res.ok) throw new Error(`font ${f.file} HTTP ${res.status}`);
      writeFileSync(p, Buffer.from(await res.arrayBuffer()));
      console.log('ok');
    }
    paths.push(p);
  }
  return paths;
}

// ----- palette (from the design reference) --------------------------------
const C = {
  bg: '#0c0406',
  text: '#f6f3f4',
  muted: '#c0a8ad',
  faint: '#8a6b72',
  accent: '#ff6b7d',
  amred: '#fa2d48',
  ampink: '#ff5e6c',
  live: '#4fe0a0',
};

// The EternalRichPresence app mark (gradient square + equalizer bars + gloss),
// scaled/positioned for reuse as the brand glyph and the card cover.
function mark(x, y, size, idx) {
  const s = size / 512;
  return `<g transform="translate(${x},${y}) scale(${s})">
    <clipPath id="sq${idx}"><rect width="512" height="512" rx="116"/></clipPath>
    <g clip-path="url(#sq${idx})">
      <rect width="512" height="512" fill="url(#markBg)"/>
      <rect x="126" y="256" width="44" height="120" rx="22" fill="#fff"/>
      <rect x="198" y="156" width="44" height="220" rx="22" fill="#fff"/>
      <rect x="270" y="216" width="44" height="160" rx="22" fill="#fff"/>
      <rect x="342" y="126" width="44" height="250" rx="22" fill="#fff"/>
      <rect width="512" height="256" fill="url(#markGloss)"/>
      <rect x="3" y="3" width="506" height="506" rx="113" fill="none" stroke="#fff" stroke-opacity="0.18" stroke-width="3"/>
    </g>
  </g>`;
}

function ogSvg() {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="base" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#2c0711"/>
      <stop offset="0.56" stop-color="#16060b"/>
      <stop offset="1" stop-color="${C.bg}"/>
    </linearGradient>
    <radialGradient id="glowRed" gradientUnits="userSpaceOnUse"
      cx="980" cy="90" r="620" fx="980" fy="90" gradientTransform="matrix(1,0,0,0.8,0,18)">
      <stop offset="0" stop-color="${C.amred}" stop-opacity="0.95"/>
      <stop offset="0.6" stop-color="${C.amred}" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="glowPink" gradientUnits="userSpaceOnUse"
      fx="1140" fy="360" cx="1140" cy="360" r="520">
      <stop offset="0" stop-color="${C.ampink}" stop-opacity="0.8"/>
      <stop offset="0.62" stop-color="${C.ampink}" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="leftScrim" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="${C.bg}" stop-opacity="0.92"/>
      <stop offset="0.5" stop-color="${C.bg}" stop-opacity="0.4"/>
      <stop offset="1" stop-color="${C.bg}" stop-opacity="0"/>
    </linearGradient>
    <linearGradient id="botScrim" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0.55" stop-color="${C.bg}" stop-opacity="0"/>
      <stop offset="1" stop-color="${C.bg}" stop-opacity="0.9"/>
    </linearGradient>
    <linearGradient id="markBg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#5865f2"/>
      <stop offset="0.5" stop-color="#c43a86"/>
      <stop offset="1" stop-color="#fa2d48"/>
    </linearGradient>
    <linearGradient id="markGloss" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#fff" stop-opacity="0.30"/>
      <stop offset="0.5" stop-color="#fff" stop-opacity="0"/>
    </linearGradient>
  </defs>

  <rect width="1200" height="630" fill="url(#base)"/>
  <rect width="1200" height="630" fill="url(#glowRed)"/>
  <rect width="1200" height="630" fill="url(#glowPink)"/>
  <rect width="1200" height="630" fill="url(#leftScrim)"/>
  <rect width="1200" height="630" fill="url(#botScrim)"/>

  <!-- brand -->
  ${mark(80, 72, 52, 0)}
  <text x="148" y="107" font-family="Space Grotesk" font-weight="600" font-size="30" fill="${C.text}">EternalRichPresence</text>

  <!-- eyebrow -->
  <text x="82" y="196" font-family="Inter" font-weight="600" font-size="18" letter-spacing="3" fill="${C.faint}">WINDOWS · FREE · OPEN SOURCE</text>

  <!-- tagline (kept clear of the card on the right) -->
  <text x="78" y="270" font-family="Space Grotesk" font-weight="600" font-size="60" letter-spacing="-1.5" fill="${C.text}">What you're</text>
  <text x="78" y="338" font-family="Space Grotesk" font-weight="600" font-size="60" letter-spacing="-1.5" fill="${C.text}">listening to,</text>
  <text x="78" y="406" font-family="Space Grotesk" font-weight="600" font-size="60" letter-spacing="-1.5" fill="${C.accent}">live on Discord.</text>

  <!-- subtitle -->
  <text x="80" y="466" font-family="Inter" font-weight="400" font-size="24" fill="${C.muted}">Apple Music &amp; Spotify on your Discord profile —</text>
  <text x="80" y="500" font-family="Inter" font-weight="400" font-size="24" fill="${C.muted}">live cover art, accurate progress, and Listen Along.</text>

  <!-- presence card -->
  <g>
    <rect x="744" y="156" width="384" height="330" rx="28" fill="#1a080d" fill-opacity="0.62" stroke="#ffffff" stroke-opacity="0.18"/>
    <rect x="744" y="156" width="384" height="2" rx="1" fill="#ffffff" fill-opacity="0.22"/>
    <!-- header -->
    <circle cx="776" cy="200" r="5" fill="${C.live}"/>
    <text x="790" y="205" font-family="Inter" font-weight="500" font-size="13" letter-spacing="1.4" fill="${C.muted}">LISTENING TO APPLE MUSIC</text>
    <!-- cover -->
    ${mark(772, 228, 96, 1)}
    <!-- title / artist -->
    <text x="888" y="266" font-family="Space Grotesk" font-weight="600" font-size="22" fill="${C.text}">Now Playing</text>
    <text x="888" y="296" font-family="Inter" font-weight="400" font-size="16" fill="${C.muted}">Apple Music · Spotify</text>
    <!-- progress -->
    <rect x="772" y="392" width="328" height="5" rx="2.5" fill="#ffffff" fill-opacity="0.16"/>
    <rect x="772" y="392" width="132" height="5" rx="2.5" fill="${C.accent}"/>
    <text x="772" y="420" font-family="Inter" font-size="13" fill="${C.faint}">1:24</text>
    <text x="1100" y="420" font-family="Inter" font-size="13" fill="${C.faint}" text-anchor="end">3:47</text>
  </g>
</svg>`;
}

function favSvg() {
  return readFileSync(join(PUBLIC, 'favicon.svg'), 'utf8');
}

function render(svg, width, fontFiles) {
  const r = new Resvg(svg, {
    fitTo: { mode: 'width', value: width },
    font: { fontFiles, loadSystemFonts: true, defaultFontFamily: 'Inter' },
    background: 'rgba(0,0,0,0)',
  });
  return r.render().asPng();
}

async function main() {
  const fontFiles = await ensureFonts();
  if (!existsSync(PUBLIC)) mkdirSync(PUBLIC, { recursive: true });

  writeFileSync(join(PUBLIC, 'og.png'), render(ogSvg(), 1200, fontFiles));
  console.log('wrote public/og.png (1200x630)');

  const fav = favSvg();
  for (const [name, size] of [
    ['apple-touch-icon.png', 180],
    ['favicon-32.png', 32],
    ['favicon-16.png', 16],
  ]) {
    writeFileSync(join(PUBLIC, name), render(fav, size, fontFiles));
    console.log(`wrote public/${name} (${size}x${size})`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
