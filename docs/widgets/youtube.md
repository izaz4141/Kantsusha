# YouTube Widget

Display latest videos from YouTube channels.

## Parameters

| Parameter       | Type     | Required | Default   | Description             |
| --------------- | -------- | -------- | --------- | ----------------------- |
| `type`          | string   | Yes      | -         | `youtube`               |
| `channels`      | string[] | Yes      | -         | Channel IDs or @handles |
| `title`         | string   | No       | `YouTube` | Widget title            |
| `view`          | string   | No       | `card`    | `list` or `card`        |
| `includeShorts` | boolean  | No       | `false`   | Include Shorts          |
| `frameless`     | boolean  | No       | `true`    | Hide header             |

## Example

```yaml
- type: youtube
  channels:
    - '@MKBHD'
    - 'UCvjgvhtUO6PcX97f9ywh2rg'
    - '@LinusTechTips'
  includeShorts: false
  view: card
```

## Channel Format

- **Handle**: `@username` (auto-resolved to channel ID)
- **Channel ID**: `UC...` (starts with UC)

## Use Cases

- Channel video feeds
- Content creator updates
- Tutorial aggregation
