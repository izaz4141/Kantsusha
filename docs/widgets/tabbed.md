# Tabbed Widget

Container widget that displays multiple widgets in tabs. You can place any other widget inside the `widgets` array to create tabbed content.

## Parameters

| Parameter | Type         | Required | Description      |
| --------- | ------------ | -------- | ---------------- |
| `type`    | string       | Yes      | `tabbed`         |
| `widgets` | BaseWidget[] | Yes      | Array of widgets |

## Example

```yaml
- type: tabbed
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
