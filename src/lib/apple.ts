/**
 * Apple Music "Most Played" chart — fetched at BUILD TIME (Astro frontmatter),
 * never client-side, so there's no CORS dependency at runtime and the page
 * ships with a real, embedded rotation set.
 *
 * The hero card's client JS only cycles this embedded set visually (no audio),
 * exactly like the mockup.
 */
import { LINKS } from './site';

export interface Track {
  name: string;
  artist: string;
  /** Cover art upscaled from the feed's 100x100 thumbnail to 400x400. */
  art: string;
}

/** How many chart entries to embed in the hero rotation. */
const TOP_N = 12;

/** Upscale Apple's 100x100 artwork URL to a crisp 400x400. */
function upscale(url: string): string {
  return url.replace('100x100bb.jpg', '400x400bb.jpg');
}

/**
 * Hardcoded fallback (today's real chart, captured at authoring time) so the
 * hero always renders covers even if the build-time fetch fails. Never a blank
 * card.
 */
export const FALLBACK_TRACKS: Track[] = [
  { name: 'Janice STFU', artist: 'Drake', art: 'https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/35/b9/06/35b90629-a873-14f8-4789-ffc324960038/26UMGIM63614.rgb.jpg/400x400bb.jpg' },
  { name: "Choosin' Texas", artist: 'Ella Langley', art: 'https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/e2/91/4d/e2914d0a-7f1d-f04c-fbf4-c50b38548838/196873638690.jpg/400x400bb.jpg' },
  { name: 'stupid song', artist: 'Olivia Rodrigo', art: 'https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/1d/1b/f9/1d1bf9b1-44c6-9a6c-6ffb-c158488c06ce/26UMGIM39303.rgb.jpg/400x400bb.jpg' },
  { name: 'Spend Dat', artist: 'Yung Miami', art: 'https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/bd/54/8d/bd548d85-4c33-2432-ecd8-e26f0585bdfd/26UMGIM41443.rgb.jpg/400x400bb.jpg' },
  { name: 'Be Her', artist: 'Ella Langley', art: 'https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/a1/ba/64/a1ba6484-f462-1b88-ddff-d4c014d5f265/196874018361.jpg/400x400bb.jpg' },
  { name: 'the cure', artist: 'Olivia Rodrigo', art: 'https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/1d/1b/f9/1d1bf9b1-44c6-9a6c-6ffb-c158488c06ce/26UMGIM39303.rgb.jpg/400x400bb.jpg' },
];

interface AppleFeedEntry {
  name?: string;
  artistName?: string;
  artworkUrl100?: string;
}

/**
 * Fetch the chart at build time. Returns the top N tracks, or the hardcoded
 * fallback on any failure (network, bad shape, empty feed).
 */
export async function getChartTracks(): Promise<Track[]> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10_000);
    const res = await fetch(LINKS.appleChart, {
      headers: { 'User-Agent': 'eternalrichpresence-web (build)' },
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (!res.ok) throw new Error(`Apple chart HTTP ${res.status}`);

    const json: unknown = await res.json();
    const results: AppleFeedEntry[] =
      (json as { feed?: { results?: AppleFeedEntry[] } })?.feed?.results ?? [];

    const tracks = results
      .map((x) => ({
        name: (x.name ?? '').trim(),
        artist: (x.artistName ?? '').trim(),
        art: x.artworkUrl100 ? upscale(x.artworkUrl100) : '',
      }))
      .filter((t): t is Track => Boolean(t.name && t.art))
      .slice(0, TOP_N);

    return tracks.length ? tracks : FALLBACK_TRACKS;
  } catch (err) {
    console.warn(
      `[apple] chart fetch failed, using fallback: ${(err as Error).message}`,
    );
    return FALLBACK_TRACKS;
  }
}
