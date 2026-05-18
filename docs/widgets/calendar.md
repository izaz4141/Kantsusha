# Calendar Widget

Display events from ICS or CalDAV calendars.

## Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `type` | string | Yes | - | `calendar` |
| `cals` | CalFeed[] | Yes | - | Array of calendars (min 1) |
| `range` | duration | No | `183d` | Date range to fetch |
| `limit` | number | No | `50` | Max events to display |

### CalFeed Object

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `type` | string | No | `ics` | `ics` or `caldav` |
| `url` | string | Yes | - | Calendar feed URL |
| `color` | string | No | - | Hex color for events |
| `headers` | object | No | - | Custom HTTP headers |

## Example

```yaml
- type: calendar
  title: My Calendar
  range: 30d
  limit: 20
  cals:
    - type: ics
      url: 'https://calendar.google.com/calendar/ical/.../basic.ics'
    - type: caldav
      url: 'https://caldav.example.com/calendars/user'
      color: '#3b82f6'
      headers:
        Authorization: 'Bearer your-token'
```

## Use Cases

- Google Calendar integration
- Nextcloud/CalDAV calendars
- Multiple calendar aggregation