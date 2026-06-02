# Configuration

## Pages

Define pages in `config.yaml`:

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
                url: 'https://...'

  - name: News
    layout: slim
    columns:
      - size: full
        widgets: []
```

### Column Sizes

| Size    | Description   |
| ------- | ------------- |
| `25%`   | Narrow column |
| `50%`   | Half width    |
| `full`  | Full width    |
| `small` | Compact       |

## Widgets

Widgets are configured within column `widgets` array:

```yaml
widgets:
  - type: rss
    title: Tech News
    feeds:
      - url: 'https://...'
```

### Common Parameters

All widgets support:

| Parameter   | Type     | Default | Description     |
| ----------- | -------- | ------- | --------------- |
| `title`     | string   | -       | Widget header   |
| `cache`     | duration | `1h`    | Cache duration  |
| `update`    | duration | `1h`    | Update interval |
| `frameless` | boolean  | `false` | Hide header     |

### Duration Format

`(\d+)(s|m|h|d|w|mo|y)`

- `30s` - 30 seconds
- `5m` - 5 minutes
- `1h` - 1 hour
- `7d` - 7 days

## Theme

```yaml
theme:
  default: dark
  presets:
    light:
      name: Rosé Pine Dawn
      light: true
      colors: {}
    dark:
      name: Rosé Pine
      light: false
      colors: {}
```

See [Theming](theming.md) for customization options.
