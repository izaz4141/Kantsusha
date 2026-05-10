# Kantsusha

A personal dashboard/homepage built with SvelteKit, featuring customizable widgets and themes.

## Features

- **Widget system**: Defaults, with custom later
- **Themes**: Customizable through config.yaml
- **SQLite database**: Using drizzle ORM (not yet used)
- **Authentication**: better-auth integration (not yet used)

## Tech Stack

- SvelteKit (Svelte 5)
- Tailwind CSS
- Bun runtime
- drizzle + libSQL
- better-auth

## Getting Started

```sh
bun install
bun run dev
```

## Commands

- `bun run dev` - Start development server
- `bun run build` - Production build
- `bun run check` - TypeScript check
- `bun run lint` - Lint and format
- `bun run db:push` - Push database schema

## Configuration

Edit `src/lib/server/config.yaml` to customize pages and widgets.
