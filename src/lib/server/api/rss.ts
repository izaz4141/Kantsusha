import { fetchURL } from '$lib/utils/network';
import type { RssArticle } from '$lib/types/widget.data';
import type { RssFeed } from '$lib/types/widget.params';

async function parseRSS(xml: string, sourceUrl: string): Promise<RssArticle[]> {
  const articles: RssArticle[] = [];
  const urlObj = new URL(sourceUrl);
  const sourceName = urlObj.hostname.replace('www.', '');

  const itemMatches = xml.matchAll(/<item>|<entry>/gi);
  const itemPositions = Array.from(itemMatches, (m) => m.index!);

  for (let i = 0; i < itemPositions.length; i++) {
    const start = itemPositions[i];
    const end = itemPositions[i + 1] || xml.length;
    const itemXml = xml.slice(start, end);

    let title = '';
    const titleMatch = itemXml.match(
      /<title><!\[CDATA\[([^\]]*?)\]\]><\/title>|<title>([^<]*)<\/title>/i,
    );
    if (titleMatch) title = titleMatch[1] || titleMatch[2] || '';

    let link = '';
    const linkMatch = itemXml.match(/<link>([^<]*)<\/link>/i);
    if (linkMatch) link = linkMatch[1];

    let pubDate: Date | null = null;
    const dateMatch = itemXml.match(/<pubDate>([^<]*)<\/pubDate>|<dc:date>([^<]*)<\/dc:date>/i);
    if (dateMatch) pubDate = new Date(dateMatch[1] || dateMatch[2] || '');

    let thumbnail = '';
    const mediaContentMatch = itemXml.match(/<media:content[^>]*url="([^"]+)"/i);
    const mediaThumbMatch = itemXml.match(/<media:thumbnail[^>]*url="([^"]+)"/i);
    const enclosureMatch = itemXml.match(/<enclosure[^>]*url="([^"]+)"/i);
    const atomLinkMatch = itemXml.match(/<link[^>]*rel="enclosure"[^>]*href="([^"]+)"/i);
    if (mediaContentMatch) thumbnail = mediaContentMatch[1];
    else if (mediaThumbMatch) thumbnail = mediaThumbMatch[1];
    else if (enclosureMatch) thumbnail = enclosureMatch[1];
    else if (atomLinkMatch) thumbnail = atomLinkMatch[1];

    // Fallback: Try to get any image from media:content regardless of position
    if (!thumbnail) {
      const anyMediaMatch = itemXml.match(/<media:[^>]+url="([^"]+\.(jpg|jpeg|png|gif|webp))"/i);
      if (anyMediaMatch) thumbnail = anyMediaMatch[1];
    }

    if (title && link && pubDate) {
      articles.push({ title, link, pubDate, source: sourceName, thumbnail });
    }
  }

  return articles;
}

export async function fetchRSS(feeds: RssFeed[], limit: number = 10): Promise<RssArticle[]> {
  const allArticles: RssArticle[] = [];

  await Promise.all(
    feeds.map(async (feed) => {
      try {
        const xml = (await fetchURL(feed.url, { customHeaders: feed.headers })) as string;
        const articles = await parseRSS(xml, feed.url);
        allArticles.push(...articles);
      } catch (err) {
        console.error(`Error fetching ${feed.url}:`, err);
      }
    }),
  );

  const length = allArticles.length;
  const temp = new Float64Array(length);
  const indices = new Int32Array(length);

  for (let i = 0; i < length; i++) {
    temp[i] = allArticles[i].pubDate.getTime();
    indices[i] = i;
  }

  indices.sort((a, b) => temp[b] - temp[a]);

  const result: RssArticle[] = new Array(limit);
  for (let i = 0; i < limit; i++) {
    result[i] = allArticles[indices[i]];
  }

  return result;
}
