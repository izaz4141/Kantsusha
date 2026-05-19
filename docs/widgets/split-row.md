# Split Row Widget

Container widget that displays multiple widgets stacked vertically. Each nested widget takes its natural height.

## Parameters

| Parameter | Type               | Required | Description      |
| --------- | ------------------ | -------- | ---------------- |
| `type`    | string             | Yes      | `split-row`      |
| `widgets` | BaseWidgetParams[] | Yes      | Array of widgets |

## Example

```yaml
- type: split-row
  widgets:
    - type: rss
      title: Tech News
      feeds:
        - url: https://tech.example.com/rss
    - type: calendar
      title: Upcoming Events
      icalUrl: https://calendar.example.com/events
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

- Vertical stacking of related widgets
- Dashboard rows with multiple content types
- Sequential information display
