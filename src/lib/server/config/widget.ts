import {
  AnyWidgetParamsSchema,
  WidgetTypeSchema,
  type AnyWidgetParams,
} from '$lib/types/widget.params';
import z from 'zod';

const VALID_WIDGET_TYPES = WidgetTypeSchema.enum;

export function validateWidget(raw: unknown): AnyWidgetParams | null {
  if (!raw || typeof raw !== 'object') {
    console.warn('Warning: Invalid widget, skipping');
    return null;
  }

  const r = raw as Record<string, unknown>;
  const type = r.type;

  if (typeof type !== 'string' || !(type in VALID_WIDGET_TYPES)) {
    console.warn(`Warning: Unknown widget type "${type}", skipping`);
    return null;
  }

  try {
    return AnyWidgetParamsSchema.parse(raw);
  } catch (err) {
    if (err instanceof z.ZodError) {
      console.warn(`Warning: Widget validation failed: ${err.issues}`);
    }
    return null;
  }
}

export function parseWidgets(rawWidgets: unknown): AnyWidgetParams[] {
  if (!Array.isArray(rawWidgets)) {
    console.warn('Warning: Widgets is not an array, skipping');
    return [];
  }

  const widgets: AnyWidgetParams[] = [];
  for (const raw of rawWidgets) {
    const widget = validateWidget(raw);
    if (widget) {
      widgets.push(widget);
    }
  }

  return widgets;
}
