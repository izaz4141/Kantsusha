import { fetchURL } from '$lib/utils/network';
import logger from '$lib/server/logger';
import type { YouTubeVideo } from '$lib/types/widget.data';
import type { YouTubeChannel } from '$lib/types/widget.params';

function parseYouTubeFeed(xml: string): YouTubeVideo[] {
  const videos: YouTubeVideo[] = [];
  const entryMatches = xml.matchAll(/<entry>/gi);
  const entryPositions = Array.from(entryMatches, (m) => m.index!);

  for (let i = 0; i < entryPositions.length; i++) {
    const start = entryPositions[i];
    const end = entryPositions[i + 1] || xml.length;
    const entryXml = xml.slice(start, end);

    let title = '';
    const titleMatch = entryXml.match(
      /<title><!\[CDATA\[([^\]]*?)\]\]><\/title>|<title>([^<]*)<\/title>/i,
    );
    if (titleMatch) title = titleMatch[1] || titleMatch[2] || '';

    let videoId = '';
    const videoIdMatch = entryXml.match(
      /<yt:videoId>([^<]*)<\/yt:videoId>|<videoId>([^<]*)<\/videoId>/i,
    );
    if (videoIdMatch) videoId = videoIdMatch[1] || videoIdMatch[2] || '';

    let pubDate: Date | null = null;
    const dateMatch = entryXml.match(/<published>([^<]*)<\/published>/i);
    if (dateMatch) pubDate = new Date(dateMatch[1] || '');

    let channelTitle = '';
    const channelTitleMatch = entryXml.match(
      /<author><name>([^<]*)<\/name><\/author>|<name>([^<]*)<\/name>/i,
    );
    if (channelTitleMatch) channelTitle = channelTitleMatch[1] || channelTitleMatch[2] || '';

    const thumbnail = videoId ? `https://img.youtube.com/vi/${videoId}/mqdefault.jpg` : '';

    if (title && videoId && pubDate) {
      videos.push({ title, videoId, pubDate, channelTitle, thumbnail });
    }
  }

  return videos;
}

async function resolveHandleToChannelId(handle: string): Promise<string | null> {
  try {
    const html = (await fetchURL(`https://www.youtube.com/${handle}`)) as string;
    const match = html.match(
      /href="https:\/\/www\.youtube\.com\/feeds\/videos\.xml\?channel_id=([^"]+)"/,
    );
    return match ? match[1] : null;
  } catch (err) {
    logger.error(err, `Youtube handle ${handle}`);
    return null;
  }
}

async function getFeedUrl(channel: string, includeShorts: boolean): Promise<string> {
  let channelId = channel;

  if (channel.startsWith('@')) {
    const resolved = await resolveHandleToChannelId(channel);
    if (!resolved) {
      throw new Error(`Could not resolve channel handle: ${channel}`);
    }
    channelId = resolved;
  }

  if (channelId.startsWith('UC')) {
    if (!includeShorts) {
      const shortId = 'UULF' + channelId.slice(2);
      return `https://www.youtube.com/feeds/videos.xml?playlist_id=${shortId}`;
    }
    return `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`;
  }

  throw new Error(`Invalid channel format: ${channel}`);
}

export async function fetchYouTube(
  channels: YouTubeChannel[],
  limit: number = 10,
  includeShorts: boolean = false,
): Promise<{ data: YouTubeVideo[]; errors: string[] }> {
  const allVideos: YouTubeVideo[] = [];
  const errors: string[] = [];

  await Promise.all(
    channels.map(async (ch) => {
      try {
        const feedUrl = await getFeedUrl(ch.channel, includeShorts);
        const xml = (await fetchURL(feedUrl)) as string;
        const videos = parseYouTubeFeed(xml);
        allVideos.push(...(ch.limit ? videos.slice(0, ch.limit) : videos));
      } catch (err) {
        logger.warn(err, `YouTube feed ${ch.channel}`);
        try {
          const { fetchYouTubeFallback } = await import('./youtube-fb');
          const fallback = await fetchYouTubeFallback([ch], limit, includeShorts);
          allVideos.push(...fallback);
        } catch (fbErr) {
          logger.error(fbErr, `YouTube scraper also failed for ${ch.channel}`);
          errors.push(`YouTube feed failed for ${ch.channel}`);
        }
      }
    }),
  );

  const length = allVideos.length;
  const temp = new Float64Array(length);
  const indices = new Int32Array(length);

  for (let i = 0; i < length; i++) {
    temp[i] = allVideos[i].pubDate.getTime();
    indices[i] = i;
  }

  indices.sort((a, b) => {
    const diff = temp[b] - temp[a];
    if (diff) return diff;
    return allVideos[a].channelTitle.localeCompare(allVideos[b].channelTitle);
  });

  const result: YouTubeVideo[] = new Array(limit);
  for (let i = 0; i < limit; i++) {
    if (indices[i] !== undefined) {
      result[i] = allVideos[indices[i]];
    }
  }

  return { data: result.filter((v) => v !== undefined), errors };
}
