# Split Column Widget

Container widget that displays multiple widgets side-by-side in a single panel. Each nested widget can have an optional size to control its width.

## Parameters

| Parameter | Type                     | Required | Description      |
| --------- | ------------------------ | -------- | ---------------- |
| `type`    | string                   | Yes      | `split-column`   |
| `widgets` | SplitColumnWidgetEntry[] | Yes      | Array of widgets |

### Widget Entry Parameters

Each widget in the `widgets` array can include:

| Parameter | Type   | Required | Default | Description                |
| --------- | ------ | -------- | ------- | -------------------------- |
| `size`    | string | No       | auto    | Width (e.g., `50%`, `30%`) |

## Example

```yaml
- type: split-column
  widgets:
    - type: rss
      title: Tech News
      size: 50%
      feeds:
        - url: https://tech.example.com/rss
    - type: reddit
      title: Technology
      size: 50%
      subreddit: technology
      sort: top
      time: day
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

- Side-by-side content comparison
- Multi-column information display
- Compact horizontal layouts
