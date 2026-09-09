# Reddit Widget

Display posts from subreddits.

## Parameters

| Parameter       | Type    | Required | Default | Description                                   |
| --------------- | ------- | -------- | ------- | --------------------------------------------- |
| `type`          | string  | Yes      | -       | `reddit`                                      |
| `subreddit`     | string  | Yes      | -       | Subreddit name (without r/)                   |
| `sort`          | string  | No       | `top`   | `top`, `hot`, `new`, `controversial`          |
| `time`          | string  | No       | `month` | `hour`, `day`, `week`, `month`, `year`, `all` |
| `showThumbnail` | boolean | No       | `false` | Show post images                              |
| `collapseAfter` | number  | No       | `5`     | Items before collapse                         |
| `limit`         | number  | No       | `10`    | Max items                                     |
| `view`          | string  | No       | `list`  | `list` or `card`                              |

## Example

```yaml
- type: reddit
  title: Selfhosted News
  subreddit: selfhosted
  sort: top
  time: week
  limit: 10
```

## Notes

- Reddit now serves a JavaScript challenge to unauthenticated clients and only
  returns data once a `loid` cookie is obtained. Kantsusha solves this
  challenge transparently and caches the cookie (refreshed every 6 hours),
  working around the resulting 403 responses.
- To avoid being blocked by Reddit/Cloudflare TLS fingerprinting, the widget
  impersonates a browser TLS handshake via Bun's native `fetch` `tls.ja3`
  options. This requires **Bun >= 1.4.1**. On older Bun versions (or non-Bun
  runtimes) the widget falls back to a standard request and still attempts the
  cookie workaround, but the TLS impersonation is skipped.

## Sort Options

| Value           | Description     |
| --------------- | --------------- |
| `hot`           | Most active     |
| `new`           | Recently posted |
| `top`           | Most upvoted    |
| `controversial` | Mixed votes     |

## Time Filters

| Value   | Description   |
| ------- | ------------- |
| `hour`  | Past hour     |
| `day`   | Past 24 hours |
| `week`  | Past 7 days   |
| `month` | Past 30 days  |
| `year`  | Past 365 days |
| `all`   | All time      |

## Use Cases

- Community monitoring
- News aggregation
- Topic-based feeds
