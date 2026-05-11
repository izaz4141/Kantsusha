# AGENTS.md

## Commands

- `bun --bun run dev` - Start dev server
- `bun --bun run build` - Production build
- `bun --bun run check` - Typecheck
- `bun --bun run lint` - Prettier + ESLint
- `bun --bun run format` - Prettier Format
- `bun --bun run test` - Run unit tests (vitest)

## Key Architecture

- Pages defined in `config.yaml` under `pages`, loaded via dynamic route `[slug]`
- Widget API: `/api/v1/widgets/[id]` (server: `src/routes/api/v1/widgets/[id]/+server.ts`)
- Widget types: `calendar`, `rss`, `reddit`, `tabbed`
- Widget validation uses Zod 4.x with discriminated unions in `src/lib/types/widget.params.ts`

## Styling

- Use Tailwind CSS with theme tokens from `src/lib/server/config.yaml`
- Never use pure CSS classes - use Tailwind utilities + theme tokens
- Theme tokens: `background`, `surface`, `text`, `primary`, `border` (see src/routes/layout.css)
- **Dynamic styling**: Never use string interpolation for Tailwind classes (e.g., `class="{dynamicVar}"`). Unused classes are removed at compile time. Instead use `style=` attribute for dynamic values.

## Database

- SQLite via libSQL (`DATABASE_URL` in `.env`)
- Schema: `src/lib/server/db/schema.ts`

## Widget Validation (Zod Refactor)

Validation now uses Zod schemas in `src/lib/types/widget.params.ts`:

- `AnyWidgetParamsSchema` - Root discriminated union for all widget types
- `CalendarParamsSchema`, `RssParamsSchema`, `RedditParamsSchema` - Individual widget schemas
- `TabbedParamsSchema` - Container widget holding nested widgets

Key Zod features used:

- `z.discriminatedUnion('type', ...)` for type-safe switch on widget type
- `.default()` for optional defaults
- `.overwrite()` for computed defaults
- `z.infer` to extract TypeScript types

Validation logic in `src/lib/server/config/widget.ts`:

- `validateWidget(raw)` - Parse and validate single widget, returns null on failure
- `parseWidgets(rawWidgets)` - Parse array of widgets, filters invalid ones

## Adding a New Widget

1. **Define Zod schema** in `src/lib/types/widget.params.ts`:

   ```ts
   export const MyWidgetParamsSchema = z.object({
     type: z.literal('mywidget'),
     title: z.string().optional(),
     param1: z.string(),
     param2: z.number().optional(),
     cache: z.string().optional(),
   });
   export type MyWidgetParams = z.infer<typeof MyWidgetParamsSchema>;
   ```

2. **Add to discriminated unions**: Update `BaseWidgetParamsSchema` or `ContainerWidgetParams`

3. **Add data types** in `src/lib/types/widget.data.ts` if needed

4. **Implement API logic** in `src/lib/server/api/mywidget.ts`

5. **Register handler** in `src/routes/api/v1/widgets/[id]/+server.ts`

6. **Create UI component** in `src/lib/components/widgets/MyWidget.svelte`

7. **Add to WidgetRenderer** in `src/lib/components/ui/WidgetRenderer.svelte`
