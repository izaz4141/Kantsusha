import { error } from '@sveltejs/kit';
import { getPageBySlug } from '$lib/server/config/config';
import { getOrCreateWidget } from '$lib/server/widget.store';

export const load = async ({ params }: { params: { slug: string } }) => {
  const page = await getPageBySlug(params.slug);

  if (!page) {
    throw error(404, `Page "${params.slug}" not found`);
  }

  const widgetIds: string[][] = [];

  for (let colIdx = 0; colIdx < page.columns.length; colIdx++) {
    const colWidgets: string[] = [];
    for (let wIdx = 0; wIdx < page.columns[colIdx].widgets.length; wIdx++) {
      const widget = page.columns[colIdx].widgets[wIdx];
      const key = `${params.slug}:${colIdx}:${wIdx}`;
      colWidgets.push(getOrCreateWidget(key, widget));
    }
    widgetIds.push(colWidgets);
  }

  return { page, widgetIds };
};
