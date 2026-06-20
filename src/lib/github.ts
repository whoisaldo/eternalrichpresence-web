/**
 * GitHub Releases — fetched at BUILD TIME so the download link, version, notes,
 * and checksum are always read back from the single source of truth (the
 * tagged release), never hardcoded. If there are no releases yet (or the fetch
 * fails), callers fall back to a "coming soon" state.
 */
import { marked } from 'marked';
import sanitizeHtml from 'sanitize-html';
import { LINKS } from './site';

export interface ReleaseAsset {
  name: string;
  url: string;
  sizeBytes: number;
  /** Hex SHA-256 from the GitHub asset `digest`, or null if not published. */
  sha256: string | null;
}

export interface Release {
  tag: string;
  name: string;
  dateISO: string;
  /** e.g. "February 25, 2026" */
  dateLabel: string;
  /** e.g. "February 2026" */
  dateMonthYear: string;
  prerelease: boolean;
  /** Raw markdown body, verbatim from the release. */
  bodyMarkdown: string;
  /** Rendered HTML of the body (owner-authored, trusted, build-time). */
  bodyHtml: string;
  htmlUrl: string;
  /** The best download asset, or null if the release has no assets. */
  download: ReleaseAsset | null;
}

export interface ReleasesData {
  /** False when there are no published releases or the fetch failed. */
  available: boolean;
  latest: Release | null;
  releases: Release[];
}

interface GhAsset {
  name: string;
  browser_download_url: string;
  size: number;
  digest?: string | null;
}
interface GhRelease {
  tag_name: string;
  name: string | null;
  published_at: string | null;
  created_at: string;
  draft: boolean;
  prerelease: boolean;
  body: string | null;
  html_url: string;
  assets: GhAsset[];
}

marked.setOptions({ gfm: true, breaks: false });

/**
 * Render a release body to HTML. The body is owner-authored and rendered at
 * build time, but the repo is public, so we sanitize defensively before it's
 * injected with set:html — scripts, event handlers, and javascript:/data: URLs
 * are stripped while the formatting a changelog needs (headings, lists, links,
 * code, images) is kept.
 */
function renderMarkdown(body: string): string {
  if (!body) return '';
  const html = marked.parse(body) as string;
  return sanitizeHtml(html, {
    allowedTags: sanitizeHtml.defaults.allowedTags.concat(['img', 'h1', 'h2']),
    allowedAttributes: {
      ...sanitizeHtml.defaults.allowedAttributes,
      img: ['src', 'alt', 'title'],
      a: ['href', 'name', 'title', 'rel', 'target'],
    },
    allowedSchemes: ['http', 'https', 'mailto'],
  });
}

/** Prefer a runnable installer, then an archive, then anything present. */
function pickAsset(assets: GhAsset[]): ReleaseAsset | null {
  if (!assets?.length) return null;
  const find = (re: RegExp) => assets.find((a) => re.test(a.name));
  const chosen =
    find(/\.exe$/i) ||
    find(/\.msi$/i) ||
    find(/\.(zip|rar|7z)$/i) ||
    assets[0];
  return {
    name: chosen.name,
    url: chosen.browser_download_url,
    sizeBytes: chosen.size,
    sha256:
      typeof chosen.digest === 'string' && chosen.digest.startsWith('sha256:')
        ? chosen.digest.slice('sha256:'.length)
        : null,
  };
}

function fmtMonthYear(iso: string): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(iso));
}
function fmtFull(iso: string): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(iso));
}

function normalize(r: GhRelease): Release {
  const iso = r.published_at || r.created_at;
  const body = r.body ?? '';
  return {
    tag: r.tag_name,
    name: (r.name && r.name.trim()) || r.tag_name,
    dateISO: iso,
    dateLabel: fmtFull(iso),
    dateMonthYear: fmtMonthYear(iso),
    prerelease: r.prerelease,
    bodyMarkdown: body,
    bodyHtml: renderMarkdown(body),
    htmlUrl: r.html_url,
    download: pickAsset(r.assets),
  };
}

export async function getReleases(): Promise<ReleasesData> {
  const empty: ReleasesData = { available: false, latest: null, releases: [] };
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10_000);
    const headers: Record<string, string> = {
      'User-Agent': 'eternalrichpresence-web (build)',
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
    };
    // Optional token lifts the unauthenticated rate limit on CI builds.
    const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
    if (token) headers.Authorization = `Bearer ${token}`;

    const res = await fetch(LINKS.releasesApi, {
      headers,
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (!res.ok) throw new Error(`GitHub releases HTTP ${res.status}`);

    const json: unknown = await res.json();
    if (!Array.isArray(json)) throw new Error('Unexpected releases payload');

    const releases = (json as GhRelease[])
      .filter((r) => !r.draft)
      .sort(
        (a, b) =>
          new Date(b.published_at || b.created_at).getTime() -
          new Date(a.published_at || a.created_at).getTime(),
      )
      .map(normalize);

    if (!releases.length) return empty;
    return { available: true, latest: releases[0], releases };
  } catch (err) {
    console.warn(
      `[github] releases fetch failed, showing coming-soon: ${(err as Error).message}`,
    );
    return empty;
  }
}

/** Human-readable file size, e.g. "32.6 MB". */
export function formatSize(bytes: number): string {
  if (!bytes || bytes < 0) return '';
  const mb = bytes / (1024 * 1024);
  if (mb >= 1) return `${mb.toFixed(1)} MB`;
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

/** Short SHA-256 display, e.g. "263009cf… 8ede". */
export function shortSha(sha: string | null): string | null {
  if (!sha || sha.length < 12) return sha;
  return `${sha.slice(0, 8)}… ${sha.slice(-4)}`;
}
