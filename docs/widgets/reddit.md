# Reddit Widget

Display posts from subreddits.

## Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `type` | string | Yes | - | `reddit` |
| `subreddit` | string | Yes | - | Subreddit name (without r/) |
| `sort` | string | No | `top` | `top`, `hot`, `new`, `controversial` |
| `time` | string | No | `month` | `hour`, `day`, `week`, `month`, `year`, `all` |
| `showThumbnail` | boolean | No | `false` | Show post images |
| `collapseAfter` | number | No | `5` | Items before collapse |
| `limit` | number | No | `10` | Max items |
| `view` | string | No | `list` | `list` or `card` |

## Example

```yaml
- type: reddit
  title: Selfhosted News
  subreddit: selfhosted
  sort: top
  time: week
  limit: 10
```

## Sort Options

| Value | Description |
|-------|-------------|
| `hot` | Most active |
| `new` | Recently posted |
| `top` | Most upvoted |
| `controversial` | Mixed votes |

## Time Filters

| Value | Description |
|-------|-------------|
| `hour` | Past hour |
| `day` | Past 24 hours |
| `week` | Past 7 days |
| `month` | Past 30 days |
| `year` | Past 365 days |
| `all` | All time |

## Use Cases

- Community monitoring
- News aggregation
- Topic-based feeds