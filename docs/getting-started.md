# Getting Started

## Prerequisites

- [Bun](https://bun.sh/) runtime
- Node.js 18+ (for fallback)

## Installation

```bash
bun install
```

## Configuration

Edit `src/lib/server/config.yaml`:

```yaml
pages:
  - name: Home
    layout: default
    columns:
      - size: 25%
        widgets:
          - type: calendar
            cals:
              - type: ics
                url: 'https://calendar.google.com/calendar/ical/.../basic.ics'

  - name: Feeds
    layout: slim
    columns:
      - size: full
        widgets:
          - type: rss
            feeds:
              - url: 'https://example.com/rss'

theme:
  default: dark
```

## Environment Variables

| Variable                 | Description          | Default                                 |
| ------------------------ | -------------------- | --------------------------------------- |
| `KANTSUSHA_DATABASE_URL` | SQLite database path | `./db/kantsusha.db`                     |
| `KANTSUSHA_ORIGINS`      | Allowed origins      | `http://localhost:*,http://127.0.0.1:*` |
| `KANTSUSHA_AUTH_SECRET`  | Auth secret          | -                                       |
| `KANTSUSHA_ASSETS_DIR`   | Assets Directory     | /app/assets                             |
| `KANTSUSHA_LOGFILE_PATH` | Log File Path        | -                                       |
| `KANTSUSHA_LOG_LEVEL`    | Log Level cut-off    | info                                    |

## Running

```bash
bun --bun run dev    # Development
bun --bun run build  # Production build
```

## Next Steps

- [Configuration](configuration.md) - Learn about pages and widgets
- [Widgets](widgets/) - Available widget types
- [Theming](theming.md) - Customize colors
