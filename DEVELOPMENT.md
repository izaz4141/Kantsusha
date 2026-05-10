# DEVELOPMENT.md

## Project Overview

SvelteKit dashboard for self-hosted apps with Docker container support. Uses Bun runtime, Drizzle ORM (SQLite), and Better-Auth.

## Technology Stack

- **Runtime**: Bun
- **Framework**: SvelteKit 2.x with Svelte 5 (runes syntax)
- **Styling**: Tailwind CSS 4.x with custom theme tokens
- **Database**: SQLite via libSQL, Drizzle ORM
- **Auth**: Better-Auth
- **Testing**: Vitest + Playwright

## Project Structure

```
src/
├── app.html              # HTML shell
├── app.d.ts             # Type declarations
├── hooks.server.ts       # Server hooks
├── routes/
│   ├── +layout.svelte         # Root layout
│   ├── +layout.server.ts     # Server-side layout data
│   ├── +page.svelte          # Home page
│   ├── layout.css            # Tailwind theme CSS
│   ├── [slug]/              # Dynamic page route (from config.yaml)
│   │   ├── +page.svelte
│   │   ├── +page.server.ts
│   │   └── +page.ts
│   ├── home/                # Static home page route (test)
│   │   ├── +page.svelte
│   │   └── +page.server.ts
│   ├── api/v1/widgets/[id]/  # Widget API
│   │   └── +server.ts
│   └── demo/better-auth/     # Auth demo routes
├── lib/
│   ├── components/
│   │   ├── layout/          # Layout components
│   │   ├── ui/             # UI components (Mostly Container)
│   │   ├── widgets/         # Widget components
│   │   └── shared/         # Shared components
│   ├── server/
│   │   ├── api/           # Widget fetch logic
│   │   ├── config/        # Config loaders (pages.ts, theme.ts, widget.ts)
│   │   ├── db/            # Database (schema.ts, auth.schema.ts)
│   │   └── auth.ts        # Better-Auth configuration
│   ├── stores/             # Svelte stores
│   ├── theme/             # Theme store and types
│   ├── types/             # TypeScript types (widget.params, widget.data, layout)
│   └── utils/             # Utility functions (time.ts, network.ts)
├── static/               # Static assets
└── ref/                  # Reference files
```

## Configuration

### config.yaml

Defines pages, themes, and widget configurations:

```yaml
presets:
  theme-name: { name: 'Theme Name', colors: { ... } }

pages:
  - name: Start
    layout: default
    columns:
      - size: 25%
        widgets:
          - type: calendar
            icals:
              - url: 'https://...'
                limit: 50
      - size: full
        widgets:
          - type: tabbed
            widgets:
              - type: reddit
                subreddit: selfhosted
                sort: top
                time: month
                limit: 10
```

### Layouts

Available layouts in `src/lib/components/layout/`:

- `Default.svelte` - Standard dashboard layout
- `Slim.svelte` - Minimal layout
- `ThreePanel.svelte` - Three-column layout
- `Header.svelte` / `Footer.svelte` - Header/footer components

## Data Flow

1. **Page Loading**: `config.yaml` → `src/lib/server/config/pages.ts` → `parsePages()` → page config objects
2. **Widget Rendering**: `src/routes/[slug]/+page.server.ts` loads page config → passes to Svelte component
3. **Widget Data Fetch**: WidgetRenderer.svelte → `/api/v1/widgets/[id]` → `fetchWidgetInfo()` → widget API files
4. **Theme**: `config.yaml` presets → `src/lib/server/config/theme.ts` → client-side theme store

## Adding a New Widget

See AGENTS.md for the 8-step widget creation workflow.

## Database

```sh
bun --bun run db:push      # Push schema to DB
bun --bun run db:generate # Generate migrations
bun --bun run db:studio   # Open Drizzle Studio
```

## Commands

```sh
bun --bun run dev      # Dev server
bun --bun run build  # Production build
bun --bun run check   # Typecheck
bun --bun run lint   # Prettier + ESLint
bun --bun run test   # Run tests (vitest)
```
