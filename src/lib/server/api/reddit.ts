import { fetchURL } from '$lib/utils/network';
import type { RedditPost } from '$lib/types/widget.data';
import { REDDIT_SORT_REGEX, REDDIT_TIME_REGEX } from '$lib/types/widget.params';

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
  sort: string = 'hot',
  limit: number = 10,
  time: string = 'day',
): Promise<RedditPost[]> {
  const safeSort = REDDIT_SORT_REGEX.test(sort) ? sort : 'hot';
  const safeTime = REDDIT_TIME_REGEX.test(time) ? time : 'day';

  const safeLimit = Math.min(Math.max(limit, 1), 100);
  let url = `https://www.reddit.com/r/${subreddit}/${safeSort}.json?limit=${safeLimit}`;

  if (safeSort === 'top') {
    url += `&t=${safeTime}`;
  }

  const response = (await fetchURL(url, { returnText: false })) as {
    data?: { children: Array<{ kind: string; data: RedditApiPost }> };
  };

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

  return posts;
}
