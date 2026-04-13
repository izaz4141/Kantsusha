import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import YAML from 'yaml';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
import type { ThemePreset } from '$lib/theme/types';
import type { PageConfig } from './pages';
import type { AnyWidget } from './widget';
import { parsePresets, generateThemeCSS } from './theme';
import { defaultTheme } from '$lib/theme/store.svelte';
import { parsePages } from './pages';
import { clearWidgetCache } from '../widget.store';

const EXTERNAL_CONFIG_PATH = '/app/config/config.yaml';
const DEFAULT_CONFIG_PATH = path.join(__dirname, '../config.yaml');

export interface ParsedConfig {
  presets: Record<string, ThemePreset>;
  css: string;
  pages: PageConfig[];
}

let configCache: { data: ParsedConfig; mtime: number } | null = null;

function getConfigMtime(): number {
  let mtime = 0;
  if (fs.existsSync(DEFAULT_CONFIG_PATH)) {
    mtime = Math.max(mtime, fs.statSync(DEFAULT_CONFIG_PATH).mtimeMs);
  }
  if (fs.existsSync(EXTERNAL_CONFIG_PATH)) {
    mtime = Math.max(mtime, fs.statSync(EXTERNAL_CONFIG_PATH).mtimeMs);
  }
  return mtime;
}

function loadYAML(filePath: string): Record<string, unknown> | null {
  if (!fs.existsSync(filePath)) {
    return null;
  }

  const content = fs.readFileSync(filePath, 'utf-8');
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

function loadConfig(): Record<string, unknown> {
  const defaults = loadYAML(DEFAULT_CONFIG_PATH);
  if (!defaults) {
    throw new Error('Failed to load default config.yaml');
  }

  const external = loadYAML(EXTERNAL_CONFIG_PATH);
  if (!external) {
    console.log('No external config found, using default config');
    return defaults;
  }

  console.log('Merging external config with defaults');
  return mergeConfig(defaults, external);
}

export function getCached(): ParsedConfig {
  const currentMtime = getConfigMtime();

  if (!configCache || configCache.mtime !== currentMtime) {
    if (configCache) {
      clearWidgetCache();
    }

    const rawConfig = loadConfig();

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

export function getPresets(): Record<string, ThemePreset> {
  return getCached().presets;
}

export function getPreset(name: string): ThemePreset {
  return getCached().presets[name] ?? getCached().presets[defaultTheme];
}

export function getThemeCSS(): string {
  return getCached().css;
}

export function getPages(): PageConfig[] {
  return getCached().pages;
}

export function getPageBySlug(slug: string): PageConfig | null {
  const pages = getCached().pages;
  const normalizedSlug = slug.toLowerCase().replace(/\s+/g, '-');
  return pages.find((p) => p.name.toLowerCase().replace(/\s+/g, '-') === normalizedSlug) ?? null;
}

export function getFirstPage(): PageConfig | null {
  const pages = getCached().pages;
  return pages[0] ?? null;
}

export function getWidgets(): AnyWidget[] {
  const pages = getCached().pages;
  const widgets: AnyWidget[] = [];
  for (const page of pages) {
    for (const column of page.columns) {
      widgets.push(...column.widgets);
    }
  }
  return widgets;
}
