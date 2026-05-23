import { getPages } from './config/config';
import { getOrCreateWidget, fetchWidgetInfo, getAllWidgets } from './widget.store';
import { timeToMs } from '$lib/utils/time';

interface RefreshEntry {
  id: string;
  timerId: ReturnType<typeof setInterval>;
}

const refreshEntries: RefreshEntry[] = [];
let initPromise: Promise<void> | null = null;

async function createAllWidgets(): Promise<void> {
  const pages = await getPages();
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
  for (const widget of getAllWidgets()) {
    const cacheTTL = timeToMs(widget.params.cache);
    if (!cacheTTL || cacheTTL <= 0) continue;

    fetchWidgetInfo(widget.id).catch(() => {});

    const timerId = setInterval(() => {
      fetchWidgetInfo(widget.id).catch(() => {});
    }, cacheTTL);

    refreshEntries.push({ id: widget.id, timerId });
  }
}

function stopAllRefreshCycles(): void {
  for (const entry of refreshEntries) {
    clearInterval(entry.timerId);
  }
  refreshEntries.length = 0;
}

export async function startBackgroundRefresh(): Promise<void> {
  if (initPromise) return initPromise;
  initPromise = (async () => {
    await createAllWidgets();
    startRefreshCycles();
  })();
  return initPromise;
}

export async function restartBackgroundRefresh(): Promise<void> {
  stopAllRefreshCycles();
  initPromise = null;
  await startBackgroundRefresh();
}
