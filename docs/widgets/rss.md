# RSS Widget

Display articles from RSS/Atom feeds.

## Parameters

| Parameter       | Type      | Required | Default | Description            |
| --------------- | --------- | -------- | ------- | ---------------------- |
| `type`          | string    | Yes      | -       | `rss`                  |
| `feeds`         | RssFeed[] | Yes      | -       | Array of feeds (min 1) |
| `title`         | string    | No       | -       | Widget title           |
| `showThumbnail` | boolean   | No       | `false` | Show article images    |
| `collapseAfter` | number    | No       | `5`     | Items before collapse  |
| `limit`         | number    | No       | `10`    | Max items              |
| `view`          | string    | No       | `list`  | `list` or `card`       |

### RssFeed Object

| Field     | Type   | Required | Description         |
| --------- | ------ | -------- | ------------------- |
| `url`     | string | Yes      | Feed URL            |
| `headers` | object | No       | Custom HTTP headers |

## Example

```yaml
- type: rss
  title: Tech News
  view: card
  showThumbnail: true
  collapseAfter: 5
  limit: 15
  feeds:
    - url: 'https://feeds.feedburner.com/TechCrunch/'
    - url: 'https://www.theverge.com/rss/index.xml'
      headers:
        User-Agent: 'Kantsusha/1.0'
```

## Use Cases

- News aggregation
- Blog tracking
- Multi-source feeds
