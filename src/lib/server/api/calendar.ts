import { fetchURL } from '$lib/utils/network';
import type { CalendarEvent } from '$lib/types/widget.data';
import type { ICalFeed } from '$lib/types/widget.params';

function parseICSDate(dateStr: string): Date {
  if (!dateStr) return new Date();

  const clean = dateStr.replace(/[-:]/g, '');
  const match = clean.match(/^(\d{4})(\d{2})(\d{2})(T(\d{2})(\d{2})(\d{2}))?/);

  if (!match) return new Date();

  const [, year, month, day, , hour, min, sec] = match;
  const date = new Date(
    parseInt(year),
    parseInt(month) - 1,
    parseInt(day),
    hour ? parseInt(hour) : 0,
    min ? parseInt(min) : 0,
    sec ? parseInt(sec) : 0,
  );

  return date;
}

function parseVEVENT(vevent: string, color: string): CalendarEvent | null {
  const uidMatch = vevent.match(/UID:([^\r\n]+)/);
  const titleMatch = vevent.match(/SUMMARY:([^\r\n]+)|SUMMARY;<[^>]*>:[^\r\n]+/);
  const startMatch = vevent.match(/DTSTART(?:;[^:]*)?:([^\r\n]+)|DTSTART;<[^>]*>:[^\r\n]+/);
  const endMatch = vevent.match(/DTEND(?:;[^:]*)?:([^\r\n]+)|DTEND;<[^>]*>:[^\r\n]+/);
  const locationMatch = vevent.match(/LOCATION:([^\r\n]+)|LOCATION;<[^>]*>:[^\r\n]+/);
  const descMatch = vevent.match(/DESCRIPTION:([^\r\n]+)|DESCRIPTION;<[^>]*>:[^\r\n]+/);

  if (!uidMatch || !titleMatch || !startMatch) {
    return null;
  }

  const title = titleMatch[1] || titleMatch[2] || 'Untitled Event';
  const cleanTitle = title.replace(/\\,/g, ',').replace(/\\;/g, ';').replace(/\\n/g, ' ').trim();

  const start = parseICSDate(startMatch[1] || startMatch[2]);
  const end = endMatch ? parseICSDate(endMatch[1] || endMatch[2]) : undefined;

  let location: string | undefined;
  if (locationMatch) {
    location = (locationMatch[1] || locationMatch[2])
      .replace(/\\,/g, ',')
      .replace(/\\;/g, ';')
      .replace(/\\n/g, ' ')
      .trim();
  }

  let description: string | undefined;
  if (descMatch) {
    description = (descMatch[1] || descMatch[2])
      .replace(/\\,/g, ',')
      .replace(/\\;/g, ';')
      .replace(/\\n/g, ' ')
      .replace(/\n/g, ' ')
      .trim();
  }

  return {
    uid: uidMatch[1].trim(),
    title: cleanTitle,
    start,
    end,
    color,
    location,
    description,
  };
}

export async function fetchCalendar(
  icals: ICalFeed[],
  limit: number = 50,
): Promise<CalendarEvent[]> {
  const allEvents: CalendarEvent[] = [];
  const colors = [
    '#ef4444',
    '#f97316',
    '#eab308',
    '#22c55e',
    '#14b8a6',
    '#3b82f6',
    '#8b5cf6',
    '#ec4899',
  ];

  await Promise.all(
    icals.map(async (ical, index) => {
      try {
        const ics = (await fetchURL(ical.url, { customHeaders: ical.headers })) as string;
        const color = ical.color || colors[index % colors.length];

        const veventMatches = ics.matchAll(/BEGIN:VEVENT[\s\S]*?END:VEVENT/gi);

        for (const match of veventMatches) {
          const event = parseVEVENT(match[0], color);
          if (event) {
            allEvents.push(event);
          }
        }
      } catch (err) {
        console.error(`Error fetching ${ical.url}:`, err);
      }
    }),
  );

  const now = Date.now();

  const optimizedEvents = allEvents
    // 1. Map to a temporary object with the pre-calculated distance
    .map((event) => ({
      event,
      dist: Math.abs(event.start.getTime() - now),
    }))
    // 2. Sort based on the pre-calculated distance
    .sort((a, b) => a.dist - b.dist)
    // 3. Take the limit and map back to the original event object
    .slice(0, limit)
    .map((item) => item.event);

  return optimizedEvents;
}
