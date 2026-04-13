import { fetchURL } from '$lib/utils/network';
import type { RedditData, RedditPost } from '$lib/types/widget.data';

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

export type RedditSort = 'hot' | 'new' | 'top' | 'rising';
export type RedditTime = 'day' | 'week' | 'month' | 'year' | 'all';

function parseRedditPost(post: RedditApiPost): RedditPost {
  let thumbnail: string | undefined;

  if (post.thumbnail) {
    thumbnail = post.thumbnail.replace(/&amp;/g, '&');
  } else if (post.preview?.images?.[0]) {
    const img = post.preview.images[0];
    thumbnail = img.source.url?.replace(/&amp;/g, '&');
  }

  return {
    title: post.title,
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
  sort: RedditSort = 'hot',
  limit: number = 10,
  time: RedditTime = 'day',
): Promise<RedditData> {
  const safeLimit = Math.min(Math.max(limit, 1), 100);
  let url = `https://www.reddit.com/r/${subreddit}/${sort}.json?limit=${safeLimit}`;

  if (sort === 'top') {
    url += `&t=${time}`;
  }

  const response = await fetchURL(url, { returnText: false });

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

  const output: RedditData = {
    subreddit: subreddit,
    sort: sort,
    time: time,
    posts: posts.slice(0, limit),
  };

  return output;
}
