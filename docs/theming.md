# Theming

## Presets

Six theme presets available:

```yaml
theme:
  default: catppuccin-mocha
```

| Preset             | Light Mode | Description           |
| ------------------ | ---------- | --------------------- |
| `light`            | Yes        | Rosé Pine Dawn        |
| `sepia`            | Yes        | Warm paper tone       |
| `catppuccin-latte` | Yes        | Catppuccin Latte      |
| `dark`             | No         | Rosé Pine (default)   |
| `high-contrast`    | No         | Accessibility-focused |
| `catppuccin-mocha` | No         | Catppuccin Mocha      |

### How Presets Work

The theming system uses a **two-layer approach**:

1. **CSS defaults** (`src/routes/layout.css`) - Provides baseline colors for `light` and `dark` presets (Rosé Pine palette)
2. **Config overrides** (`src/lib/server/config.yaml`) - Presets can override any colors via the `colors` object

Presets with empty `colors: {}` use the CSS defaults:

```yaml
# Uses CSS defaults from layout.css
theme:
  default: dark
  presets:
    dark:
      name: Rosé Pine
      light: false
      colors: {} # empty = use CSS defaults
```

Presets with custom colors override the CSS:

```yaml
# Custom colors override CSS defaults
theme:
  default: sepia
  presets:
    sepia:
      name: Sepia
      light: true
      colors:
        background: '#f5f0e6'
        surface: '#ebe4d4'
        primary: '#b8860b'
        # ... other custom colors
```

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

## Token Usage Guide

### Surface Colors

| Token            | Usage                                                  |
| ---------------- | ------------------------------------------------------ |
| `background`     | Page background, main container fill                   |
| `surface`        | Cards, widgets, dropdowns, default content backgrounds |
| `surface-raised` | Hover states, elevated elements, selected items        |
| `surface-sunken` | Input fields, pressed/active states, recessed areas    |

### Text Colors

| Token             | Usage                                                       |
| ----------------- | ----------------------------------------------------------- |
| `text`            | Primary content, headings, body text                        |
| `text-muted`      | Secondary content, labels, timestamps, placeholders         |
| `text-on-primary` | Text on primary/secondary/success/warning/error backgrounds |

### Action Colors

| Token            | Usage                                               |
| ---------------- | --------------------------------------------------- |
| `primary`        | Primary buttons, links, active states, main accent  |
| `primary-hover`  | Hover state for primary elements                    |
| `primary-active` | Active/pressed state, focus rings on selected items |
| `secondary`      | Secondary buttons, alternative actions              |

### Semantic Colors

| Token     | Usage                                            |
| --------- | ------------------------------------------------ |
| `success` | Positive states, online status, positive changes |
| `warning` | Caution states, paused, restarting, intermediate |
| `error`   | Error states, offline, unhealthy, dead           |
| `info`    | Informational states, neutral highlights         |

### Border Colors

| Token           | Usage                                     |
| --------------- | ----------------------------------------- |
| `border`        | Default borders, dividers, separators     |
| `border-strong` | Major section dividers, prominent borders |

### State Colors

| Token     | Usage                                                           |
| --------- | --------------------------------------------------------------- |
| `ring`    | Focus rings, outline states                                     |
| `overlay` | Modal/dialog backdrops (use `bg-transparent` for click-through) |
