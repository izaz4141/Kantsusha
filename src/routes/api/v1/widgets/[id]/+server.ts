import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { fetchWidgetInfo } from '$lib/server/widget.store';

export const GET: RequestHandler = async ({ params }) => {
  const widgetId = params.id;

  if (!widgetId) {
    return json({ error: 'Widget ID required' }, { status: 400 });
  }

  try {
    const result = await fetchWidgetInfo(widgetId);
    return json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to fetch widget data';
    console.error(err);
    return json({ error: message }, { status: 502 });
  }
};
