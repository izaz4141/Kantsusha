import { decode } from 'he';
import { fetchURL, supportsBunTlsFingerprint, type BunTlsFingerprint } from '$lib/utils/network';
import logger from '$lib/server/logger';
import type { RedditPost } from '$lib/types/widget.data';
import { REDDIT_SORT_REGEX, REDDIT_TIME_REGEX } from '$lib/utils/constants';

interface RedditApiPost {
  title: string;
  url: string;
  created_utc: number;
  author: string;
  score: number;
  num_comments: number;
  subreddit: string;
  permalink: string;
  thumbnail: string;
  preview?: {
    images: Array<{
      source: { url: string; width: number; height: number };
      resolutions: Array<{ url: string; width: number; height: number }>;
    }>;
  };
  is_video: boolean;
}

/**
 * Chrome TLS fingerprint used to impersonate a real browser. Reddit/Cloudflare
 * fingerprint clients at the TLS handshake (JA3/JA4) and block non-browser
 * handschakes, so we pass these options through to Bun's native `fetch`.
 * This profile matches Chrome and is compatible with Bun's strict JA3 parser.
 */
const REDDIT_TLS: BunTlsFingerprint = {
  ja3: '771,4865-4866-4867-49195-49199-49196-49200-52393-52392-49171-49172-156-157-47-53,0-23-65281-10-11-35-16-5-13-18-51-45-43-27-17513-21,29-23-24,0',
  grease: true,
  permuteExtensions: true,
};

function getBrowserUserAgent(): string {
  return 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';
}

// Reddit serves a JS challenge (Cloudflare-style) to unauthenticated clients.
// Solving it requires echoing back a value and yields a `loid` cookie without
// which the `.json` endpoints return 403. Flow adapted from glanceapp/glance
// (internal/glance/widget-reddit.go).
const REDDIT_CHALLENGE_REGEX = /await\(async \w+\s*=>\s*\w+\s*\+\s*\w+\)\("([^"]+)"\)/;
const REDDIT_TOKEN_REGEX = /name="jsc_token"\s+value="([^"]+)"/;

function parseSetCookie(response: Response): string | undefined {
  const getSetCookie = response.headers.getSetCookie;
  if (typeof getSetCookie === 'function') {
    const cookies = getSetCookie.call(response.headers);
    for (const cookie of cookies) {
      const match = /^loid=([^;]+)/.exec(cookie);
      if (match) return match[1];
    }
    return undefined;
  }
  const raw = response.headers.get('set-cookie');
  if (!raw) return undefined;
  const match = /loid=([^;]+)/.exec(raw);
  return match ? match[1] : undefined;
}

async function fetchRedditLoidCookieRaw(): Promise<string> {
  const challengeBody = (await fetchURL('https://www.reddit.com/', {
    returnText: true,
    userAgent: getBrowserUserAgent(),
    tls: REDDIT_TLS,
    retry: 0,
  })) as string;

  const challengeMatch = REDDIT_CHALLENGE_REGEX.exec(challengeBody);
  const tokenMatch = REDDIT_TOKEN_REGEX.exec(challengeBody);

  if (!challengeMatch) {
    throw new Error('no JS challenge found on reddit');
  }
  if (!tokenMatch) {
    throw new Error('no token found in reddit challenge page');
  }

  const challengeStr = challengeMatch[1];
  const token = tokenMatch[1];
  // The inline JS computes `e + e`, so the solution is the string doubled.
  const solution = challengeStr + challengeStr;
  const url = `https://www.reddit.com/?solution=${encodeURIComponent(solution)}&js_challenge=1&jsc_token=${encodeURIComponent(token)}`;

  let loid: string | undefined;
  await fetchURL(url, {
    returnText: true,
    userAgent: getBrowserUserAgent(),
    tls: REDDIT_TLS,
    retry: 0,
    captureResponse: (response) => {
      loid = parseSetCookie(response);
    },
  });

  if (!loid) {
    throw new Error('no loid cookie found after submitting challenge solution');
  }
  return loid;
}

// Cache the `loid` cookie for 6 hours (the cookie is presumably valid for 24h)
// and deduplicate concurrent fetches so multiple widget instances don't hammer
// the challenge flow. Falls back to the previous value if a refresh fails.
const LOID_CACHE_TTL = 6 * 60 * 60 * 1000;

let cachedLoid: string | undefined;
let lastLoidUpdate = 0;
let inFlightLoid: Promise<string> | undefined;

async function getRedditLoidCookie(): Promise<string | undefined> {
  if (cachedLoid && Date.now() - lastLoidUpdate < LOID_CACHE_TTL) {
    return cachedLoid;
  }

  if (inFlightLoid) {
    try {
      return await inFlightLoid;
    } catch {
      return cachedLoid;
    }
  }

  inFlightLoid = (async () => {
    try {
      const loid = await fetchRedditLoidCookieRaw();
      cachedLoid = loid;
      lastLoidUpdate = Date.now();
      return loid;
    } catch (err) {
      logger.warn(`Could not fetch new reddit loid cookie: ${err}`);
      if (cachedLoid) {
        return cachedLoid;
      }
      throw err;
    }
  })().finally(() => {
    inFlightLoid = undefined;
  });

  try {
    return await inFlightLoid;
  } catch {
    return undefined;
  }
}

if (!supportsBunTlsFingerprint()) {
  logger.warn(
    'Reddit widget: Bun TLS fingerprinting (tls.ja3) is unavailable; upgrade to Bun >= 1.4.1 for TLS impersonation',
  );
}

function parseRedditPost(post: RedditApiPost): RedditPost {
  let thumbnail: string | undefined;

  if (post.thumbnail) {
    thumbnail = decode(post.thumbnail);
  } else if (post.preview?.images?.[0]) {
    const img = post.preview.images[0];
    thumbnail = decode(img.source.url);
  }

  return {
    title: decode(post.title),
    link: post.url,
    pubDate: new Date(post.created_utc * 1000),
    author: post.author,
    score: post.score,
    numComments: post.num_comments,
    subreddit: post.subreddit,
    permalink: `https://reddit.com${post.permalink}`,
    thumbnail,
  };
}

export async function fetchRedditPosts(
  subreddit: string,
  sort: string = 'hot',
  limit: number = 10,
  time: string = 'day',
): Promise<{ data: RedditPost[]; errors: string[] }> {
  const errors: string[] = [];
  const safeSort = REDDIT_SORT_REGEX.test(sort) ? sort : 'hot';
  const safeTime = REDDIT_TIME_REGEX.test(time) ? time : 'day';

  const safeLimit = Math.min(Math.max(limit, 1), 100);
  let url = `https://www.reddit.com/r/${subreddit}/${safeSort}.json?limit=${safeLimit}`;

  if (safeSort === 'top') {
    url += `&t=${safeTime}`;
  }

  const loid = await getRedditLoidCookie();
  if (!loid) {
    errors.push(`Failed to solve reddit challenge for r/${subreddit}`);
  }

  const customHeaders: Record<string, string> = {};
  if (loid) {
    customHeaders.Cookie = `loid=${loid}`;
  }

  let response: {
    data?: { children: Array<{ kind: string; data: RedditApiPost }> };
  };
  try {
    response = (await fetchURL(url, {
      returnText: false,
      customHeaders,
      userAgent: getBrowserUserAgent(),
      tls: REDDIT_TLS,
    })) as {
      data?: { children: Array<{ kind: string; data: RedditApiPost }> };
    };
  } catch (err) {
    logger.error(err, `Reddit r/${subreddit}`);
    errors.push(`Failed to fetch subreddit r/${subreddit}`);
    return { data: [], errors };
  }

  const posts: RedditPost[] = [];
  const children = response.data?.children || [];

  for (const child of children) {
    if (child.kind === 't3' && child.data) {
      try {
        const post = parseRedditPost(child.data);
        posts.push(post);
      } catch {
        continue;
      }
    }
  }

  return { data: posts, errors };
}
