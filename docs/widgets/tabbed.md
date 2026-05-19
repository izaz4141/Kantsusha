# Tabbed Widget

Container widget that displays multiple widgets in tabs. You can place any other widget inside the `widgets` array to create tabbed content.

## Parameters

| Parameter | Type              | Required | Description      |
| --------- | ----------------- | -------- | ---------------- |
| `type`    | string            | Yes      | `tabbed`         |
| `widgets` | AnyWidgetParams[] | Yes      | Array of widgets |

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

Any widget type can be nested, including other container widgets:

- `calendar`
- `rss`
- `reddit`
- `youtube`
- `twitch-channel`
- `markets`
- `services`
- `custom-api`
- `tabbed`
- `split-column`
- `split-row`

## Use Cases

- Category-based grouping
- Multi-source aggregation
- Compact widget panels
