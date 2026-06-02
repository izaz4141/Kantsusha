# AGENTS.md

## Commands

Use `bun --bun` prefix:

- `bun --bun run dev` — Dev server
- `bun --bun run build` — `vite build` then copies `src/lib/server/config.yaml` → `build/config.yaml`
- `bun --bun run check` — `svelte-kit sync && svelte-check`
- `bun --bun run lint` — Prettier check + ESLint
- `bun --bun run format` — Prettier write
- `bun --bun run test` / `test:unit -- --run` — Vitest
- `bunx drizzle-kit push|generate|studio` — DB schema
- `bun --bun run preview` — Vite preview

## Config

Pages/themes in `src/lib/server/config.yaml`. Quirks:

> **Keep `docs/` in sync**: If a change modifies config.yaml behavior, update `docs/configuration.md` and any affected docs.

- **External override**: `./config/config.yaml` merges on top (presets merge, pages replace)
- **`$include`** directive includes other YAML files, supports `{overrides}`
- **`${VAR}` substitution** via `substituteEnvRecursive`
- **Dev path**: `src/lib/server/config.yaml`; **Prod path**: `build/config.yaml`
- Env prefix: `KANTSUSHA_*` (DB, ORIGINS, AUTH_SECRET, ASSETS_DIR)

## Architecture

- **SvelteKit 2 + Svelte 5 (runes)**: `$state`, `$derived`, `$effect`, `$props`
- **Adapter**: `svelte-adapter-bun`
- **Pages**: `config.yaml` → `[slug]` dynamic route via `getPageBySlug()`
- **Widgets**: LRU cache (`widget.store.ts`), background refresh (`widget.scheduler.ts`), handlers via `registerWidget(type, fn)`
- **Validation**: Zod 4.x discriminated unions in `src/lib/types/widget.params.ts`
- **Theme cookie**: `Kantussha-theme` (double `s`)

## Tests

Two Vitest projects in `vite.config.ts`:

- **client**: Playwright browser — `src/**/*.svelte.{test,spec}.{ts,js}`, excludes `src/lib/server/**`
- **server**: node env — `src/**/*.{test,spec}.{ts,js}`, excludes svelte tests

Run focused: `bun --bun run test:unit -- --project server`

## Styling

- Tailwind 4.x via `@tailwindcss/vite` (no config file)
- Theme tokens as CSS vars in `src/routes/layout.css`, referenced via `@theme`
- **Never** string-interpolate classes (`class="{var}"`) — use `style=` for dynamic values
- Prettier sorts Tailwind classes via `prettier-plugin-tailwindcss`

## Adding a Widget

1. Define Zod schema in `src/lib/types/widget.params.ts` (add to `BaseWidgetParamsSchema`)
2. Add types in `src/lib/types/widget.data.ts` if needed
3. Implement API logic in `src/lib/server/api/<name>.ts`
4. Register handler in `src/lib/server/widget.store.ts` via `registerWidget('type', handler)`
5. Create component in `src/lib/components/widgets/<Name>Widget.svelte`
6. Add to `WidgetRenderer.svelte` conditional chain
