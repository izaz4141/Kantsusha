import { fetchURL } from '$lib/utils/network';
import logger from '$lib/server/logger';
import type { TwitchChannel } from '$lib/types/widget.data';

const TWITCH_GQL_ENDPOINT = 'https://gql.twitch.tv/gql';
const TWITCH_GQL_CLIENT_ID = 'kimne78kx3ncx6brgo4mv6wki5h1ko';

const CHANNEL_SHELL_HASH = '580ab410bcd0c1ad194224957ae2241e5d252b2c5173d8e0cce9d32d5bb14efe';
const STREAM_METADATA_HASH = '676ee2f834ede42eb4514cdb432b3134fefc12590080c9a2c9bb44a2a4a63266';

interface OperationResponse {
  data: {
    userOrError?: {
      id: string;
      login: string;
      displayName: string;
      profileImageURL: string;
      stream: {
        __typename?: string;
        id: string;
        viewersCount: number;
      } | null;
      bannerImageURL: string;
      channel: {
        id: string;
        self: {
          isAuthorized: boolean;
          __typename: string;
        };
      };
      __typename?: string;
    } | null;
    user?: {
      id: string;
      isPartner: boolean;
      profileImageURL: string;
      __typename?: string;
      stream: {
        __typename?: string;
        id: string;
        type: string;
        createdAt: string;
        game: {
          __typename?: string;
          id: string;
          slug: string;
          name: string;
        };
      } | null;
      lastBroadcast: {
        __typename?: string;
        id: string;
        title: string;
      } | null;
    } | null;
  };
  extensions: {
    operationName: string;
  };
}

async function fetchChannelInfo(username: string): Promise<TwitchChannel | null> {
  const body = JSON.stringify([
    {
      operationName: 'ChannelShell',
      variables: { login: username },
      extensions: {
        persistedQuery: { version: 1, sha256Hash: CHANNEL_SHELL_HASH },
      },
    },
    {
      operationName: 'StreamMetadata',
      variables: { channelLogin: username },
      extensions: {
        persistedQuery: { version: 1, sha256Hash: STREAM_METADATA_HASH },
      },
    },
  ]);

  try {
    const rawResponse = await fetchURL(TWITCH_GQL_ENDPOINT, {
      method: 'POST',
      customHeaders: {
        'Client-ID': TWITCH_GQL_CLIENT_ID,
        'Content-Type': 'application/json',
      },
      body,
      returnText: false,
    });

    const responses = rawResponse as OperationResponse[];

    let channelShell: OperationResponse | null = null;
    let streamMetadata: OperationResponse | null = null;

    for (const response of responses) {
      switch (response.extensions.operationName) {
        case 'ChannelShell':
          channelShell = response;
          break;
        case 'StreamMetadata':
          streamMetadata = response;
          break;
      }
    }

    const userOrError = channelShell?.data?.userOrError;
    if (!userOrError || userOrError.__typename !== 'User') {
      logger.warn({ username }, '[twitch-channel]: No user for');
      return null;
    }

    const streamMeta = streamMetadata?.data?.user?.stream;
    const lastBroadcast = streamMetadata?.data?.user?.lastBroadcast;

    const isLive = userOrError.stream !== null;
    const viewerCount = isLive ? (userOrError.stream?.viewersCount ?? 0) : -1;
    const thumbnailUrl = isLive
      ? `https://static-cdn.jtvnw.net/previews-ttv/live_user_${userOrError.login}-320x180.jpg`
      : undefined;

    return {
      username: userOrError.login,
      nickname: userOrError.displayName,
      avatarUrl: userOrError.profileImageURL,
      isLive,
      category: streamMeta?.game?.name,
      categorySlug: streamMeta?.game?.slug,
      streamTitle: lastBroadcast?.title,
      viewerCount,
      startedAt: streamMeta?.createdAt ? new Date(streamMeta.createdAt) : undefined,
      thumbnailUrl,
    };
  } catch (err) {
    logger.error(err, `Twitch ${username}`);
    return {
      username,
      nickname: username,
      avatarUrl: '',
      isLive: false,
      viewerCount: 0,
    };
  }
}

export async function fetchTwitchChannels(
  channels: string[],
  sort: 'live' | 'views' = 'live',
): Promise<TwitchChannel[]> {
  const results = await Promise.all(channels.map((channel) => fetchChannelInfo(channel)));

  const validResults = results.filter((r): r is TwitchChannel => r !== null);

  let sorted: TwitchChannel[];
  if (sort === 'live') {
    sorted = validResults.sort((a, b) => {
      if (a.isLive && !b.isLive) return -1;
      if (!a.isLive && b.isLive) return 1;
      return b.viewerCount - a.viewerCount;
    });
  } else {
    sorted = validResults.sort((a, b) => b.viewerCount - a.viewerCount);
  }
  return sorted;
}
