import { getOrCreateWidget, fetchWidgetInfo, getAllWidgets } from './widget.store';
import { timeToMs } from '$lib/utils/time';
import type { PageConfig } from '$lib/types/pages';
import logger from '$lib/utils/logger';

interface RefreshEntry {
  id: string;
  timerId: ReturnType<typeof setInterval>;
}

const refreshEntries: RefreshEntry[] = [];
let initPromise: Promise<void> | null = null;

async function createAllWidgets(pages: PageConfig[]): Promise<void> {
  for (const page of pages) {
    const slug = page.name.toLowerCase().replace(/\s+/g, '-');
    for (let colIdx = 0; colIdx < page.columns.length; colIdx++) {
      for (let wIdx = 0; wIdx < page.columns[colIdx].widgets.length; wIdx++) {
        const widget = page.columns[colIdx].widgets[wIdx];
        const id = `${slug}:${colIdx}:${wIdx}`;
        getOrCreateWidget(id, widget);
      }
    }
  }
}

function startRefreshCycles(): void {
  const widgets = getAllWidgets();
  for (let i = 0; i < widgets.length; i++) {
    const widget = widgets[i];
    const cacheTTL = timeToMs(widget.params.cache);
    if (!cacheTTL || cacheTTL <= 0) continue;

    setTimeout(() => {
      fetchWidgetInfo(widget.id).catch(() => {});

      const timerId = setInterval(() => {
        logger.info(`Refreshing ${widget.id} Widget Data`);
        fetchWidgetInfo(widget.id).catch(() => {});
      }, cacheTTL);

      refreshEntries.push({ id: widget.id, timerId });
    }, i * 250);
  }
}

function stopAllRefreshCycles(): void {
  for (const entry of refreshEntries) {
    clearInterval(entry.timerId);
  }
  refreshEntries.length = 0;
}

export async function startBackgroundRefresh(pages: PageConfig[]): Promise<void> {
  if (initPromise) return initPromise;
  initPromise = (async () => {
    await createAllWidgets(pages);
    startRefreshCycles();
  })();
  return initPromise;
}

export async function restartBackgroundRefresh(pages: PageConfig[]): Promise<void> {
  stopAllRefreshCycles();
  initPromise = null;
  await startBackgroundRefresh(pages);
}
