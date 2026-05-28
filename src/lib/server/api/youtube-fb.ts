import { fetchURL } from '$lib/utils/network';
import type { YouTubeVideo } from '$lib/types/widget.data';

const LOCALE_HEADERS = { 'Accept-Language': 'en-US,en;q=0.9' };

export function extractChannelName(data: unknown): string | null {
  const d = data as Record<string, unknown>;
  const metadata = d.metadata as Record<string, unknown> | undefined;
  const renderer = metadata?.channelMetadataRenderer as Record<string, unknown> | undefined;
  return (renderer?.title as string) ?? null;
}

export function parseYtInitialData(html: string): unknown {
  const match = html.match(/var ytInitialData\s*=\s*\{/);
  if (!match) throw new Error('ytInitialData not found in HTML');
  const start = match.index! + match[0].length - 1;
  let depth = 1;
  let pos = start + 1;
  while (depth > 0 && pos < html.length) {
    if (html[pos] === '{') depth++;
    else if (html[pos] === '}') depth--;
    else if (html[pos] === '"') {
      pos++;
      while (pos < html.length && html[pos] !== '"') {
        if (html[pos] === '\\') pos++;
        pos++;
      }
    }
    pos++;
  }
  return JSON.parse(html.slice(start, pos));
}

export function parseRelativeDate(text: string): Date {
  if (!text) return new Date();
  const now = Date.now();
  const lower = text.toLowerCase();

  const patterns: [RegExp, number][] = [
    [/(\d+)\s*(year|years|yr|y)/, 365.25 * 24 * 60 * 60 * 1000],
    [/(\d+)\s*(month|months|mo)/, 30.44 * 24 * 60 * 60 * 1000],
    [/(\d+)\s*(week|weeks|w)\b/, 7 * 24 * 60 * 60 * 1000],
    [/(\d+)\s*(day|days|d)\b/, 24 * 60 * 60 * 1000],
    [/(\d+)\s*(hour|hours|h)\b/, 60 * 60 * 1000],
    [/(\d+)\s*(minute|minutes|m)\b/, 60 * 1000],
    [/(\d+)\s*(second|seconds|s)\b/, 1000],
    [/(\d+)\s*(tahun|thn)/, 365.25 * 24 * 60 * 60 * 1000],
    [/(\d+)\s*(bulan|bln)/, 30.44 * 24 * 60 * 60 * 1000],
    [/(\d+)\s*(minggu|mgg)/, 7 * 24 * 60 * 60 * 1000],
    [/(\d+)\s*(hari)\b/, 24 * 60 * 60 * 1000],
    [/(\d+)\s*(jam)/, 60 * 60 * 1000],
    [/(\d+)\s*(menit|mnt)/, 60 * 1000],
    [/(\d+)\s*(detik|dtk)/, 1000],
  ];

  for (const [regex, ms] of patterns) {
    const m = lower.match(regex);
    if (m) {
      return new Date(now - parseInt(m[1]) * ms);
    }
  }

  return new Date(now);
}

export function extractVideosFromTab(data: unknown, channelTitle: string): YouTubeVideo[] {
  const videos: YouTubeVideo[] = [];

  const d = data as Record<string, unknown>;
  const contents = d.contents as Record<string, unknown> | undefined;
  const browseRenderer = contents?.twoColumnBrowseResultsRenderer as
    | Record<string, unknown>
    | undefined;
  const tabs = browseRenderer?.tabs;
  if (!Array.isArray(tabs)) return videos;

  let items: Record<string, unknown>[] = [];
  for (const tab of tabs) {
    const t = tab as Record<string, unknown>;
    const r = (t.tabRenderer ?? t.expandableTabRenderer ?? {}) as Record<string, unknown>;
    const grid = (r.content as Record<string, unknown> | undefined)?.richGridRenderer as
      | Record<string, unknown>
      | undefined;
    const gridContents = grid?.contents;
    if (Array.isArray(gridContents) && gridContents.length > 0) {
      items = gridContents as Record<string, unknown>[];
      break;
    }
  }

  for (const item of items) {
    const renderer = item?.richItemRenderer;
    if (!renderer) continue;

    const content = renderer.content || {};

    const lvm = content.lockupViewModel;
    if (lvm) {
      const videoId = lvm.contentId || '';
      const meta = lvm.metadata?.lockupMetadataViewModel || {};
      const title = meta.title?.content || '';
      const mdRows = meta.metadata?.contentMetadataViewModel?.metadataRows || [];

      let dateText = '';
      for (const row of mdRows) {
        for (const part of row.metadataParts || []) {
          const t = part.text?.content || '';
          if (
            t &&
            /\d+\s*(year|years|yr|y|month|months|mo|week|weeks|w|day|days|d|hour|hours|minute|minutes|m|second|seconds|s|tahun|bulan|minggu|hari|jam|menit|detik|thn|bln|mgg|h|mnt|dtk)\b/i.test(
              t,
            )
          ) {
            dateText = t;
          }
        }
      }

      if (title && videoId) {
        videos.push({
          title,
          videoId,
          pubDate: parseRelativeDate(dateText),
          channelTitle: channelTitle || '',
          thumbnail: `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`,
        });
      }
      continue;
    }

    const slvm = content.shortsLockupViewModel;
    if (slvm) {
      const videoId =
        slvm.onTap?.videoId || slvm.onTap?.innertubeCommand?.reelWatchEndpoint?.videoId || '';
      const title =
        slvm.overlayMetadata?.primaryText?.content ||
        slvm.accessibilityText?.replace(/ - play Short$/, '') ||
        '';
      if (title && videoId) {
        videos.push({
          title,
          videoId,
          pubDate: new Date(),
          channelTitle: channelTitle || '',
          thumbnail: `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`,
        });
      }
    }
  }

  return videos;
}

function buildChannelUrl(channel: string, subpath: string): string {
  const base = channel.startsWith('@')
    ? `https://www.youtube.com/${channel}`
    : `https://www.youtube.com/channel/${channel}`;
  return `${base}/${subpath}`;
}

function channelLabel(channel: string): string {
  return channel.startsWith('@') ? channel.slice(1) : channel;
}

export async function fetchYouTubeFallback(
  channels: string[],
  limit: number = 10,
  includeShorts: boolean = false,
): Promise<YouTubeVideo[]> {
  const allVideos: YouTubeVideo[] = [];

  await Promise.all(
    channels.map(async (channel) => {
      try {
        const html = (await fetchURL(buildChannelUrl(channel, 'videos'), {
          customHeaders: LOCALE_HEADERS,
        })) as string;
        const data = parseYtInitialData(html);
        const name = extractChannelName(data) || channelLabel(channel);
        const videos = extractVideosFromTab(data, name);
        allVideos.push(...videos);

        if (includeShorts) {
          try {
            const shortsHtml = (await fetchURL(buildChannelUrl(channel, 'shorts'), {
              customHeaders: LOCALE_HEADERS,
            })) as string;
            const shortsData = parseYtInitialData(shortsHtml);
            const shorts = extractVideosFromTab(shortsData, name);
            allVideos.push(...shorts);
          } catch (err) {
            console.error(`YouTube shorts fallback ${channel}:`, err);
          }
        }
      } catch (err) {
        console.error(`YouTube fallback ${channel}:`, err);
      }
    }),
  );

  allVideos.sort((a, b) => b.pubDate.getTime() - a.pubDate.getTime());

  return allVideos.slice(0, limit);
}
