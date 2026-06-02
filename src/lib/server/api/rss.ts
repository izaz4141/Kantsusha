import { fetchURL } from '$lib/utils/network';
import logger from '$lib/server/logger';
import type { RssArticle } from '$lib/types/widget.data';
import type { RssFeed } from '$lib/types/widget.params';

async function parseRSS(
  xml: string,
  sourceUrl: string,
): Promise<{ articles: RssArticle[]; errors: string[] }> {
  const articles: RssArticle[] = [];
  const errors: string[] = [];
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
    const linkHrefMatch = itemXml.match(/<link[^>]*href="([^"]+)"/i);
    if (linkMatch) link = linkMatch[1];
    else if (linkHrefMatch) link = linkHrefMatch[1];

    let pubDate: Date | null = null;
    const dateMatch = itemXml.match(
      /<pubDate>([^<]*)<\/pubDate>|<dc:date>([^<]*)<\/dc:date>|<published>([^<]*)<\/published>|<updated>([^<]*)<\/updated>/i,
    );
    if (dateMatch)
      pubDate = new Date(dateMatch[1] || dateMatch[2] || dateMatch[3] || dateMatch[4] || '');

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

    if (link) link = link.replace(/&amp;/g, '&');
    if (thumbnail) thumbnail = thumbnail.replace(/&amp;/g, '&');

    if (title && link && pubDate) {
      articles.push({ title, link, pubDate, source: sourceName, thumbnail });
    } else if (title) {
      const msg = `RSS entry skipped: missing link or date for "${title.slice(0, 80)}"`;
      logger.warn(msg);
      errors.push(msg);
    }
  }

  return { articles, errors };
}

export async function fetchRSS(
  feeds: RssFeed[],
  limit: number = 10,
  sort: boolean = true,
): Promise<{ data: RssArticle[]; errors: string[] }> {
  const allArticles: RssArticle[] = [];
  const errors: string[] = [];

  await Promise.all(
    feeds.map(async (feed) => {
      try {
        const xml = (await fetchURL(feed.url, { customHeaders: feed.headers })) as string;
        const { articles, errors: parseErrors } = await parseRSS(xml, feed.url);
        allArticles.push(...(feed.limit ? articles.slice(0, feed.limit) : articles));
        errors.push(...parseErrors);
      } catch (err) {
        logger.error(err, `RSS ${feed.url}`);
        errors.push(`Failed to fetch RSS: ${feed.url}`);
      }
    }),
  );

  if (sort) {
    const times = allArticles.map((a) => a.pubDate.getTime());
    const indices = Array.from({ length: allArticles.length }, (_, i) => i);
    indices.sort((a, b) => {
      const diff = times[b] - times[a];
      if (diff) return diff;
      return allArticles[a].source.localeCompare(allArticles[b].source);
    });

    return { data: indices.slice(0, limit).map((i) => allArticles[i]), errors };
  }

  return { data: allArticles.slice(0, limit), errors };
}
