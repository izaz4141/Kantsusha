# Theming

## Presets

Four built-in theme presets:

```yaml
theme: dark # light, sepia, dark, high-contrast
```

| Preset          | Light Mode | Description           |
| --------------- | ---------- | --------------------- |
| `light`         | Yes        | Clean white           |
| `sepia`         | Yes        | Warm paper tone       |
| `dark`          | No         | Dark slate            |
| `high-contrast` | No         | Accessibility-focused |

## Theme Tokens

CSS custom properties in `src/routes/layout.css`:

| Token                     | Light                  | Dark               |
| ------------------------- | ---------------------- | ------------------ |
| `--color-background`      | #fcfcfd                | #0f172a            |
| `--color-surface`         | #ffffff                | #1e293b            |
| `--color-surface-raised`  | #ffffff                | #334155            |
| `--color-surface-sunken`  | #f1f3f5                | #020617            |
| `--color-text`            | #111827                | #f8fafc            |
| `--color-text-muted`      | #4b5563                | #94a3b8            |
| `--color-text-on-primary` | #ffffff                | #ffffff            |
| `--color-primary`         | #0066ff                | #3b82f6            |
| `--color-primary-hover`   | #0052cc                | #60a5fa            |
| `--color-primary-active`  | #0747a6                | #93c5fd            |
| `--color-secondary`       | #4f46e5                | #818cf8            |
| `--color-success`         | #16a34a                | #34d399            |
| `--color-warning`         | #d97706                | #fbbf24            |
| `--color-error`           | #dc2626                | #f87171            |
| `--color-info`            | #0ea5e9                | #60a5fa            |
| `--color-border`          | #e2e8f0                | #334155            |
| `--color-border-strong`   | #cbd5e1                | #475569            |
| `--color-ring`            | rgba(0, 102, 255, 0.2) | #1e40af            |
| `--color-overlay`         | rgba(15, 23, 42, 0.5)  | rgba(0, 0, 0, 0.7) |

## Semantic Colors

| Token       | Purpose           |
| ----------- | ----------------- |
| `secondary` | Secondary actions |
| `success`   | Positive states   |
| `warning`   | Caution states    |
| `error`     | Error states      |
| `info`      | Informational     |
| `ring`      | Focus rings       |
| `overlay`   | Modal backdrops   |

## Customizing

Edit `src/routes/layout.css` to modify tokens:

```css
:root {
  --color-primary: #8b5cf6; /* Purple accent */
  --color-background: #1a1a2e;
  --color-surface: #16213e;
}
```
