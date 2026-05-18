# Twitch Channel Widget

Display live status of Twitch channels.

## Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `type` | string | Yes | - | `twitch-channel` |
| `channels` | string[] | Yes | - | Twitch usernames |
| `title` | string | No | `Twitch Channels` | Widget title |
| `sort` | string | No | `live` | `live` or `views` |

## Example

```yaml
- type: twitch-channel
  title: Live Streams
  channels:
    - esl_dota2
    - zy0xxx
    - zajef77
  sort: live
```

## Sort Options

| Value | Description |
|-------|-------------|
| `live` | Live channels first, then offline |
| `views` | Sort by viewer count |

## Use Cases

- Esports tracking
- Streamer monitoring
- Gaming dashboards