import { parseWidgets } from './widget';
import type { AnyWidgetParams } from '$lib/types/widget.params';

export type CssUnit = `${number}px` | `${number}rem` | `${number}%`;

export interface PageColumn {
  size: 'small' | 'full' | CssUnit;
  widgets: AnyWidgetParams[];
}

export interface PageConfig {
  name: string;
  layout: string;
  columns: PageColumn[];
}

const VALID_SIZES = ['small', 'full'] as const;

const CSS_UNIT_REGEX = /^\d+(px|rem|%)$/;

function isValidSize(value: unknown): value is 'small' | 'full' | CssUnit {
  if (typeof value !== 'string') return false;
  if (VALID_SIZES.includes(value as (typeof VALID_SIZES)[number])) return true;
  return CSS_UNIT_REGEX.test(value);
}

function validatePage(rawPage: unknown, index: number): PageConfig | null {
  if (!rawPage || typeof rawPage !== 'object') {
    console.warn(`Warning: Invalid page at index ${index}, skipping`);
    return null;
  }

  const p = rawPage as Record<string, unknown>;

  if (typeof p.name !== 'string') {
    console.warn(`Warning: Page at index ${index} missing "name", skipping`);
    return null;
  }

  const layout = typeof p.layout === 'string' ? p.layout : 'default';

  const columnsRaw = p.columns;
  if (!columnsRaw || !Array.isArray(columnsRaw)) {
    console.warn(`Warning: Page "${p.name}" missing "columns" array, skipping`);
    return null;
  }

  const columns: PageColumn[] = [];
  for (const colRaw of columnsRaw) {
    if (!colRaw || typeof colRaw !== 'object') continue;

    const col = colRaw as Record<string, unknown>;
    const size =
      col.size && isValidSize(col.size) ? (col.size as 'small' | 'full' | CssUnit) : 'full';

    const widgetsRaw = col.widgets;
    const widgets = Array.isArray(widgetsRaw) ? parseWidgets(widgetsRaw) : [];

    columns.push({ size, widgets });
  }

  if (columns.length === 0) {
    console.warn(`Warning: Page "${p.name}" has no valid columns, skipping`);
    return null;
  }

  return {
    name: p.name,
    layout,
    columns,
  };
}

export function parsePages(rawPages: unknown): PageConfig[] {
  if (!Array.isArray(rawPages)) {
    console.warn('Warning: Pages is not an array, returning empty');
    return [];
  }

  const pages: PageConfig[] = [];
  for (let i = 0; i < rawPages.length; i++) {
    const page = validatePage(rawPages[i], i);
    if (page) {
      pages.push(page);
    }
  }

  return pages;
}
