# Tabbed Widget

Container widget that displays multiple widgets in tabs.

## Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `type` | string | Yes | - | `tabbed` |
| `widgets` | BaseWidget[] | Yes | - | Array of widgets |
| `id` | string | No | `N/A` | Tab container ID |

## Example

```yaml
- type: tabbed
  id: news-feeds
  widgets:
    - type: reddit
      title: Tech
      subreddit: technology
      sort: top
      time: day
    - type: reddit
      title: Science
      subreddit: science
      sort: top
      time: day
    - type: rss
      title: News
      feeds:
        - url: https://news.example.com/rss
```

## Nested Widgets

Any base widget type can be nested:

- `calendar`
- `rss`
- `reddit`
- `youtube`
- `twitch-channel`
- `markets`
- `services`
- `custom-api`

## Use Cases

- Category-based grouping
- Multi-source aggregation
- Compact widget panels