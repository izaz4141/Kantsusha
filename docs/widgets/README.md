# Widgets

## Available Widgets

| Widget                                      | Description                  |
| ------------------------------------------- | ---------------------------- |
| [Calendar](widgets/calendar.md)             | ICS/CalDAV calendar events   |
| [RSS](widgets/rss.md)                       | RSS/Atom feed aggregation    |
| [Reddit](widgets/reddit.md)                 | Subreddit posts              |
| [YouTube](widgets/youtube.md)               | YouTube channel videos       |
| [Twitch Channel](widgets/twitch-channel.md) | Twitch stream status         |
| [Markets](widgets/markets.md)               | Stock/crypto prices          |
| [Services](widgets/services.md)             | Links with status checks     |
| [Custom API](widgets/custom-api.md)         | Generic API widget           |
| [Tabbed](widgets/tabbed.md)                 | Container for nested widgets |
| [Split Column](widgets/split-column.md)     | Side-by-side widget layout   |

## Container Widgets

Some widgets are **containers** that hold other widgets inside them. These let you group multiple widgets together in a single panel.

### Available Container Widgets

- **Tabbed** - Displays nested widgets as tabs
- **Split Column** - Displays nested widgets side-by-side

## Common Parameters

```yaml
- type: <widget>
  title: Widget Title # Optional header
  cache: 1h # Cache duration (default: 1h)
  update: 1h # Update interval
  frameless: false # Hide header
```

## Duration Format

`(\d+)(s|m|h|d|w|mo|y)`

- `30s`, `5m`, `1h`, `7d`, `2w`, `3mo`, `1y`
