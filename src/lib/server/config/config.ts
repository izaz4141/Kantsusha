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

const includedFiles = new Set<string>();

function deepMerge(target: unknown, source: unknown): unknown {
  if (source === null || source === undefined) return target;
  if (typeof source !== 'object') return source;

  if (Array.isArray(source)) return source;
  if (Array.isArray(target)) return source;

  const result = { ...(target as Record<string, unknown>) };
  for (const [key, value] of Object.entries(source as Record<string, unknown>)) {
    result[key] = deepMerge(result[key], value);
  }
  return result;
}

async function resolveIncludes(
  obj: unknown,
  baseDir: string,
  visited: Set<string> = new Set(),
): Promise<unknown> {
  if (obj === null || obj === undefined) return obj;

  if (Array.isArray(obj)) {
    const resolved: unknown[] = [];
    for (const item of obj) {
      if (item && typeof item === 'object' && !Array.isArray(item)) {
        const itemObj = item as Record<string, unknown>;
        if ('$include' in itemObj) {
          const includePath = itemObj.$include;
          if (typeof includePath !== 'string') {
            console.warn(`Warning: $include must be a string, skipping`);
            resolved.push(item);
            continue;
          }

          const resolvedPath = path.resolve(baseDir, includePath);

          if (visited.has(resolvedPath)) {
            throw new Error(`Circular $include detected: ${includePath}`);
          }
          visited.add(resolvedPath);
          includedFiles.add(resolvedPath);

          const included = await loadYAML(resolvedPath);
          if (included === null) {
            visited.delete(resolvedPath);
            console.warn(`Warning: Failed to load included file: ${includePath}`);
            resolved.push(item);
            continue;
          }

          const includedResolved = await resolveIncludes(
            included,
            path.dirname(resolvedPath),
            visited,
          );
          visited.delete(resolvedPath);

          const { $include, ...overrides } = itemObj;
          if (Object.keys(overrides).length > 0) {
            if (Array.isArray(includedResolved)) {
              for (const item of includedResolved) {
                resolved.push(deepMerge(item, overrides));
              }
            } else {
              resolved.push(deepMerge(includedResolved, overrides));
            }
          } else {
            if (Array.isArray(includedResolved)) {
              resolved.push(...includedResolved);
            } else {
              resolved.push(includedResolved);
            }
          }
        } else {
          resolved.push(await resolveIncludes(item, baseDir, visited));
        }
      } else {
        resolved.push(await resolveIncludes(item, baseDir, visited));
      }
    }
    return resolved;
  }

  if (typeof obj === 'object') {
    const objRecord = obj as Record<string, unknown>;
    if ('$include' in objRecord) {
      const includePath = objRecord.$include;
      if (typeof includePath !== 'string') {
        console.warn(`Warning: $include must be a string, skipping`);
        return obj;
      }

      const resolvedPath = path.resolve(baseDir, includePath);

      if (visited.has(resolvedPath)) {
        throw new Error(`Circular $include detected: ${includePath}`);
      }
      visited.add(resolvedPath);
      includedFiles.add(resolvedPath);

      const included = await loadYAML(resolvedPath);
      if (included === null) {
        visited.delete(resolvedPath);
        console.warn(`Warning: Failed to load included file: ${includePath}`);
        return obj;
      }

      const includedResolved = await resolveIncludes(included, path.dirname(resolvedPath), visited);
      visited.delete(resolvedPath);

      const { $include, ...overrides } = objRecord;
      if (Object.keys(overrides).length > 0) {
        if (Array.isArray(includedResolved)) {
          return includedResolved.map((item) => deepMerge(item, overrides));
        }
        return deepMerge(includedResolved, overrides);
      }
      return includedResolved;
    }

    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(objRecord)) {
      result[key] = await resolveIncludes(value, baseDir, visited);
    }
    return result;
  }

  return obj;
}

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
  for (const filePath of includedFiles) {
    if (await exists(filePath)) {
      mtime = Math.max(mtime, (await stat(filePath)).mtimeMs);
    }
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

  return (await resolveIncludes(parsed, path.dirname(filePath))) as Record<string, unknown>;
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
    includedFiles.clear();

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
