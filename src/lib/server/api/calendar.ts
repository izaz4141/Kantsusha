import { decode } from 'he';
import { fetchURL } from '$lib/utils/network';
import { timeToMs } from '$lib/utils/time';
import logger from '$lib/server/logger';
import type { CalendarEvent } from '$lib/types/widget.data';
import type { CalFeed } from '$lib/types/widget.params';

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

function formatCalDAVDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hour = String(date.getUTCHours()).padStart(2, '0');
  const min = String(date.getUTCMinutes()).padStart(2, '0');
  const sec = String(date.getUTCSeconds()).padStart(2, '0');
  return `${year}${month}${day}T${hour}${min}${sec}Z`;
}

async function fetchCalDAVCalendarColor(feed: CalFeed): Promise<string | null> {
  const propfindXml = `<?xml version="1.0" encoding="UTF-8"?>
<d:propfind xmlns:d="DAV:" xmlns:cd="http://apple.com/ns/ical/">
  <d:prop>
    <cd:calendar-color />
  </d:prop>
</d:propfind>`;

  try {
    const response = await fetchURL(feed.url, {
      method: 'PROPFIND',
      customHeaders: {
        'Content-Type': 'application/xml; charset=utf-8',
        Depth: '0',
        ...feed.headers,
      },
      body: propfindXml,
    });

    const xml = response as string;
    const colorMatch = xml.match(/<cd:calendar-color[^>]*>([^<]+)<\/cd:calendar-color>/i);
    return colorMatch ? colorMatch[1].trim() : null;
  } catch (err) {
    logger.error(err, `Calendar color ${feed.url}`);
    return null;
  }
}

async function fetchCalDAVCalendar(
  feed: CalFeed,
  range: string,
): Promise<{ ics: string; color: string | null }> {
  const rangeMs = timeToMs(range) ?? 0;
  if (rangeMs <= 0) {
    logger.error('Caldav range request cant have range <= 0');
    return { ics: '', color: null };
  }

  const now = new Date();
  const pastDate = new Date(now.getTime() - rangeMs);
  const futureDate = new Date(now.getTime() + rangeMs);

  if (pastDate >= futureDate) {
    return { ics: '', color: null };
  }

  const startStr = formatCalDAVDate(pastDate);
  const endStr = formatCalDAVDate(futureDate);

  const caldavXml = `<?xml version="1.0" encoding="UTF-8"?>
<c:calendar-query xmlns:d="DAV:" xmlns:c="urn:ietf:params:xml:ns:caldav">
  <d:prop>
    <d:displayname />
    <c:calendar-data />
  </d:prop>
  <c:filter>
    <c:comp-filter name="VCALENDAR">
      <c:comp-filter name="VEVENT">
        <c:time-range start="${startStr}" end="${endStr}"/>
      </c:comp-filter>
    </c:comp-filter>
  </c:filter>
</c:calendar-query>`;

  const eventsResponse = await fetchURL(feed.url, {
    method: 'REPORT',
    customHeaders: {
      'Content-Type': 'application/xml; charset=utf-8',
      Depth: '1',
      ...feed.headers,
    },
    body: caldavXml,
  });

  const icsRaw = eventsResponse as string;
  if (icsRaw.includes('<d:error') || icsRaw.includes('<D:error')) {
    logger.error(`CalDAV error ${feed.url}: %s`, icsRaw);
    return { ics: '', color: null };
  }

  const feedColor = await fetchCalDAVCalendarColor(feed);

  return { ics: icsRaw, color: feedColor };
}

function parseCalDAVMultistatus(xml: string): string[] {
  const icalBlocks: string[] = [];
  const calendarDataMatches = xml.matchAll(/<c:calendar-data>([\s\S]*?)<\/c:calendar-data>/gi);

  for (const match of calendarDataMatches) {
    const content = match[1].trim();
    const decoded = decode(content);

    if (decoded.includes('BEGIN:VCALENDAR')) {
      icalBlocks.push(decoded);
    }
  }

  return icalBlocks;
}

export async function fetchCalendar(
  cals: CalFeed[] = [],
  range: string = '183d',
  limit: number = 50,
): Promise<{ data: CalendarEvent[]; errors: string[] }> {
  if (cals.length === 0) {
    return { data: [], errors: [] };
  }
  const allEvents: CalendarEvent[] = [];
  const errors: string[] = [];
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
    cals.map(async (cal, index) => {
      try {
        let feedColor: string | undefined;
        let icsContent: string;

        if (cal.type === 'caldav') {
          const result = await fetchCalDAVCalendar(cal, range);
          icsContent = result.ics;
          feedColor = result.color || undefined;
          const icalBlocks = parseCalDAVMultistatus(icsContent);
          icsContent = icalBlocks.join('\n');
        } else {
          icsContent = (await fetchURL(cal.url, { customHeaders: cal.headers })) as string;
        }

        const color = cal.color || feedColor || colors[index % colors.length];

        const veventMatches = icsContent.matchAll(/BEGIN:VEVENT[\s\S]*?END:VEVENT/gi);

        for (const match of veventMatches) {
          const event = parseVEVENT(match[0], color);
          if (event) {
            allEvents.push(event);
          }
        }
      } catch (err) {
        logger.error(err, `Calendar ${cal.url}`);
        errors.push(`Failed to fetch calendar: ${cal.url}`);
      }
    }),
  );

  const now = Date.now();
  const dists = allEvents.map((e) => Math.abs(e.start.getTime() - now));
  const indices = Array.from({ length: allEvents.length }, (_, i) => i);
  indices.sort((a, b) => {
    const diff = dists[a] - dists[b];
    if (diff) return diff;
    return allEvents[a].title.localeCompare(allEvents[b].title);
  });

  return { data: indices.slice(0, limit).map((i) => allEvents[i]), errors };
}
