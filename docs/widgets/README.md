# Widgets

## Available Widgets

| Widget | Description |
|--------|-------------|
| [Calendar](widgets/calendar.md) | ICS/CalDAV calendar events |
| [RSS](widgets/rss.md) | RSS/Atom feed aggregation |
| [Reddit](widgets/reddit.md) | Subreddit posts |
| [YouTube](widgets/youtube.md) | YouTube channel videos |
| [Twitch Channel](widgets/twitch-channel.md) | Twitch stream status |
| [Markets](widgets/markets.md) | Stock/crypto prices |
| [Services](widgets/services.md) | Links with status checks |
| [Custom API](widgets/custom-api.md) | Generic API widget |
| [Tabbed](widgets/tabbed.md) | Container for nested widgets |

## Common Parameters

```yaml
- type: <widget>
  title: Widget Title      # Optional header
  cache: 1h               # Cache duration (default: 1h)
  update: 1h              # Update interval
  frameless: false        # Hide header
```

## Duration Format

`(\d+)(s|m|h|d|w|mo|y)`

- `30s`, `5m`, `1h`, `7d`, `2w`, `3mo`, `1y`