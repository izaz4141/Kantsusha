# AGENTS.md

## Commands

- `bun --bun run dev` - Start dev server
- `bun --bun run build` - Production build
- `bun --bun run check` - Typecheck
- `bun --bun run lint` - Prettier + ESLint
- `bun --bun run db:push` / `db:generate` - Database migrations

## Key Architecture

- Pages defined in `config.yaml` under `pages`, loaded via dynamic route `[slug]`
- Widget API: `/api/v1/widgets/[id]` (server: `src/routes/api/v1/widgets/[id]/+server.ts`)
- Widget types: `calendar`, `rss`, `reddit`, `tabbed`

## Styling

- Use Tailwind CSS with theme tokens from `src/lib/server/config.yaml` 
- Never use pure CSS classes - use Tailwind utilities + theme tokens
- Theme tokens: `background`, `surface`, `text`, `primary`, `border`, (see src/routes/layout.css).

## Database

- SQLite via libSQL (`DATABASE_URL` in `.env`)
- Schema: `src/lib/server/db/schema.ts`

## Adding a New Widget

1. **Define interface** in `src/lib/types/widget.interfaces.ts`:

   ```ts
   export interface MyWidget {
     type: 'mywidget';
     title?: string;
     param1: string;
     param2?: number;
     cache?: string;
   }
   ```

2. **Add to union types**: Update `AnyWidget` and `WidgetType`

3. **Add data types** in `src/lib/types/widget.data.ts`:

   ```ts
   export interface MyWidgetData {
     items: MyItem[];
   }
   ```

4. **Add schema validation** in `src/lib/types/widget.schema.ts`:

   ```ts
   mywidget: {
     required: ['param1'],
     allowed: ['title', 'param1', 'param2', 'param3'],
   }
   ```

5. **Implement API logic** in `src/lib/server/api/mywidget.ts`:

   ```ts
   export async function fetchMyWidget(params: MyWidget): Promise<WidgetData> {
     // fetch and transform data
     return { data, params };
   }
   ```

6. **Register handler** in `src/routes/api/v1/widgets/[id]/+server.ts`

7. **Create UI component** in `src/lib/components/widgets/MyWidget.svelte`

8. **Add to WidgetRenderer** in `src/lib/components/ui/WidgetRenderer.svelte`
