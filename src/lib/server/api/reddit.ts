import { decode } from 'he';
import { fetchURL } from '$lib/utils/network';
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

  let response: {
    data?: { children: Array<{ kind: string; data: RedditApiPost }> };
  };
  try {
    response = (await fetchURL(url, { returnText: false })) as {
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
