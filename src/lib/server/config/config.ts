import { exists, stat, readFile } from 'node:fs/promises';
import path from 'node:path';
import YAML from 'yaml';
import { dev } from '$app/environment';

const BASE_DIR = process.cwd();
const ENTRYDIR = path.dirname(process.argv[1]);

import type { ThemePreset } from '$lib/theme/types';
import type { PageConfig } from './pages';
import type { AnyWidgetParams } from '$lib/types/widget.params';
import { parsePresets, generateThemeCSS } from './theme';
import { defaultTheme } from '$lib/theme/store.svelte';
import { parsePages } from './pages';
import { clearWidgetCache } from '../widget.store';

const EXTERNAL_CONFIG_PATH = './config/config.yaml';
const DEFAULT_CONFIG_PATH = !dev
  ? path.resolve(ENTRYDIR, 'config.yaml')
  : path.resolve(BASE_DIR, 'src/lib/server/config.yaml');
console.log(DEFAULT_CONFIG_PATH);
export interface ParsedConfig {
  presets: Record<string, ThemePreset>;
  css: string;
  pages: PageConfig[];
}

let configCache: { data: ParsedConfig; mtime: number } | null = null;

async function getConfigMtime(): Promise<number> {
  let mtime = 0;
  if (await exists(DEFAULT_CONFIG_PATH)) {
    mtime = Math.max(mtime, (await stat(DEFAULT_CONFIG_PATH)).mtimeMs);
  }
  if (await exists(EXTERNAL_CONFIG_PATH)) {
    mtime = Math.max(mtime, (await stat(EXTERNAL_CONFIG_PATH)).mtimeMs);
  }
  return mtime;
}

async function loadYAML(filePath: string): Promise<Record<string, unknown> | null> {
  if (!(await exists(filePath))) {
    return null;
  }

  const content = await readFile(filePath, 'utf-8');
  let parsed: unknown;
  try {
    parsed = YAML.parse(content);
  } catch {
    console.warn(`Warning: Failed to parse YAML from ${filePath}`);
    return null;
  }

  if (!parsed || typeof parsed !== 'object') {
    console.warn(`Warning: Invalid YAML format in ${filePath}`);
    return null;
  }

  return parsed as Record<string, unknown>;
}

function mergeConfig(
  defaults: Record<string, unknown>,
  external: Record<string, unknown> | null,
): Record<string, unknown> {
  const result: Record<string, unknown> = { ...defaults };

  if (!external) {
    return result;
  }

  for (const [key, value] of Object.entries(external)) {
    if (key === 'presets' && typeof value === 'object' && typeof result.presets === 'object') {
      result.presets = {
        ...(result.presets as Record<string, unknown>),
        ...(value as Record<string, unknown>),
      };
    } else if (key === 'pages' && Array.isArray(value)) {
      result.pages = value;
    } else {
      result[key] = value;
    }
  }

  return result;
}

async function loadConfig(): Promise<Record<string, unknown>> {
  const defaults = await loadYAML(DEFAULT_CONFIG_PATH);
  if (!defaults) {
    throw new Error('Failed to load default config.yaml');
  }

  const external = await loadYAML(EXTERNAL_CONFIG_PATH);
  if (!external) {
    console.log('No external config found, using default config');
    return defaults;
  }

  console.log('Merging external config with defaults');
  return mergeConfig(defaults, external);
}

export async function getCached(): Promise<ParsedConfig> {
  const currentMtime = await getConfigMtime();

  if (!configCache || configCache.mtime !== currentMtime) {
    if (configCache) {
      clearWidgetCache();
    }

    const rawConfig = await loadConfig();

    const rawPresets = rawConfig.presets;
    const presets =
      typeof rawPresets === 'object' && rawPresets !== null ? parsePresets(rawPresets) : {};

    if (Object.keys(presets).length === 0) {
      throw new Error('No valid presets found in config');
    }

    const css = generateThemeCSS(presets);

    const rawPages = rawConfig.pages;
    const pages = parsePages(rawPages);

    configCache = {
      data: { presets, css, pages },
      mtime: currentMtime,
    };
  }

  return configCache.data;
}

export async function getPresets(): Promise<Record<string, ThemePreset>> {
  return (await getCached()).presets;
}

export async function getPreset(name: string): Promise<ThemePreset> {
  const cache = await getCached();
  return cache.presets[name] ?? cache.presets[defaultTheme];
}

export async function getThemeCSS(): Promise<string> {
  return (await getCached()).css;
}

export async function getPages(): Promise<PageConfig[]> {
  return (await getCached()).pages;
}

export async function getPageBySlug(slug: string): Promise<PageConfig | null> {
  const pages = (await getCached()).pages;
  const normalizedSlug = slug.toLowerCase().replace(/\s+/g, '-');
  return pages.find((p) => p.name.toLowerCase().replace(/\s+/g, '-') === normalizedSlug) ?? null;
}

export async function getFirstPage(): Promise<PageConfig | null> {
  const pages = (await getCached()).pages;
  return pages[0] ?? null;
}

export async function getWidgets(): Promise<AnyWidgetParams[]> {
  const pages = (await getCached()).pages;
  const widgets: AnyWidgetParams[] = [];
  for (const page of pages) {
    for (const column of page.columns) {
      widgets.push(...column.widgets);
    }
  }
  return widgets;
}
