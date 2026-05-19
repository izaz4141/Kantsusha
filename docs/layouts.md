# Layouts

## Default Layout

Switchable multi-column layout. Column sizes are configurable with any CSS unit.

```yaml
pages:
  - name: Dashboard
    layout: default
    columns:
      - size: 25%
        widgets: [...]
      - size: 50%
        widgets: [...]
```

Features:

- Panel switching via header buttons
- Column sizes: `25%`, `50%`, `full`, `small`, or any CSS unit

## Slim Layout

Centered single column, 80% width.

```yaml
pages:
  - name: News
    layout: slim
    columns:
      - size: full
        widgets: [...]
```

Best for:

- Content-focused pages
- Reading RSS/Reddit feeds

## Three-Panel Layout

Fixed three-column layout with 25%, 50%, 25% proportions.

```yaml
pages:
  - name: Main
    layout: three-panel
    columns:
      - size: 25%
        widgets: [...]
      - size: 50%
        widgets: [...]
      - size: 25%
        widgets: [...]
```

Best for:

- Dense information display
- Multiple widget types at once
