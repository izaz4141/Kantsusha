import type { PageServerLoad } from './$types';
import { createWidget } from '$lib/server/widget.store';

export const load: PageServerLoad = async () => {
  const calendarWidget = createWidget('home:calendar', 'calendar', {
    icals: [
      {
        url: 'https://calendar.google.com/calendar/ical/id.indonesian%23holiday%40group.v.calendar.google.com/public/basic.ics',
      },
    ],
    limit: 50,
  });
  const rssWidget = createWidget('home:rss', 'rss', {
    feeds: [
      {
        url: 'https://selfh.st/rss/',
      },
    ],
    showThumbnail: true,
    collapseAfter: 5,
  });
  const redditWidget = createWidget('home:reddit', 'reddit', {
    subreddit: 'selfhosted',
    sort: 'top',
    limit: 10,
    showThumbnail: true,
    collapseAfter: 5,
  });

  return {
    calendarId: calendarWidget.id,
    rssId: rssWidget.id,
    redditId: redditWidget.id,
  };
};
