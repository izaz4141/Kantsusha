# YouTube Widget

Display latest videos from YouTube channels.

## Parameters

| Parameter       | Type     | Required | Default   | Description                                                  |
| --------------- | -------- | -------- | --------- | ------------------------------------------------------------ |
| `type`          | string   | Yes      | -         | `youtube`                                                    |
| `channels`      | object[] | Yes      | -         | Array of channel entries (see below)                         |
| `title`         | string   | No       | `YouTube` | Widget title                                                 |
| `view`          | string   | No       | `card`    | `list` or `card`                                             |
| `includeShorts` | boolean  | No       | `false`   | Include Shorts                                               |
| `sort`          | boolean  | No       | `true`    | Sort by date (newest first). `false` preserves channel order |
| `frameless`     | boolean  | No       | `true`    | Hide header                                                  |

### Channel Entry

| Field     | Type   | Required | Default | Description                                 |
| --------- | ------ | -------- | ------- | ------------------------------------------- |
| `channel` | string | Yes      | -       | Channel ID (`UC...`) or @handle             |
| `limit`   | number | No       | -       | Max videos per channel (before global sort) |

If `limit` is not set, all fetched videos from that channel are included.

## Example

```yaml
- type: youtube
  channels:
    - channel: '@MKBHD'
    - channel: 'UCvjgvhtUO6PcX97f9ywh2rg'
      limit: 5
    - channel: '@LinusTechTips'
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
