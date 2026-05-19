# Widget API

## Endpoint

```
GET /api/v1/widgets/[id]
```

Fetches widget data by ID.

## Response

```json
{
  "data": { ... },
  "params": { ... }
}
```

| Field    | Description                |
| -------- | -------------------------- |
| `data`   | Widget-specific data       |
| `params` | Original config parameters |

## Widget Data Types

| Widget           | Data              |
| ---------------- | ----------------- | ---------------- |
| `calendar`       | `CalendarEvent[]` |
| `rss`            | `RssArticle[]`    |
| `reddit`         | `RedditPost[]`    |
| `youtube`        | `YouTubeVideo[]`  |
| `twitch-channel` | `TwitchChannel[]` |
| `markets`        | `MarketData[]`    |
| `services`       | `(ContainerData   | EndpointData)[]` |
| `custom-api`     | `CustomApiData`   |
| `tabbed`         | `TabbedData`      |

## Caching

Widget responses are cached based on `cache` parameter:

- `30m` - 30 minutes
- `1h` - 1 hour
- `7d` - 7 days

Cache is LRU-based with max 500 entries.

## Error Handling

Failed requests return HTTP 500 with error details:

```json
{
  "error": "Failed to fetch RSS feed",
  "message": "Fetch failed: timeout"
}
```
