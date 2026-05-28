import { describe, it, expect } from 'vitest';
import { fetchURL } from '$lib/utils/network';
import type { YouTubeChannel } from '$lib/types/widget.params';
import {
  parseYtInitialData,
  parseRelativeDate,
  extractVideosFromTab,
  fetchYouTubeFallback,
  extractChannelName,
} from './youtube-fb';

const toChannels = (ids: string[]): YouTubeChannel[] => ids.map((c) => ({ channel: c }));

describe('parseRelativeDate', () => {
  it('parses "X day(s) ago"', () => {
    const d = parseRelativeDate('3 days ago');
    const diff = Date.now() - d.getTime();
    expect(diff).toBeGreaterThan(2 * 24 * 60 * 60 * 1000);
    expect(diff).toBeLessThan(4 * 24 * 60 * 60 * 1000);
  });

  it('parses "X week(s) ago"', () => {
    const d = parseRelativeDate('2 weeks ago');
    const diff = Date.now() - d.getTime();
    expect(diff).toBeGreaterThan(13 * 24 * 60 * 60 * 1000);
    expect(diff).toBeLessThan(15 * 24 * 60 * 60 * 1000);
  });

  it('parses "X month(s) ago"', () => {
    const d = parseRelativeDate('3 months ago');
    const diff = Date.now() - d.getTime();
    expect(diff).toBeGreaterThan(2 * 30 * 24 * 60 * 60 * 1000);
    expect(diff).toBeLessThan(4 * 31 * 24 * 60 * 60 * 1000);
  });

  it('parses "X year(s) ago"', () => {
    const d = parseRelativeDate('1 year ago');
    const diff = Date.now() - d.getTime();
    expect(diff).toBeGreaterThan(364 * 24 * 60 * 60 * 1000);
    expect(diff).toBeLessThan(366 * 24 * 60 * 60 * 1000);
  });

  it('parses Indonesian "X minggu yang lalu"', () => {
    const d = parseRelativeDate('2 minggu yang lalu');
    const diff = Date.now() - d.getTime();
    expect(diff).toBeGreaterThan(13 * 24 * 60 * 60 * 1000);
    expect(diff).toBeLessThan(15 * 24 * 60 * 60 * 1000);
  });

  it('parses Indonesian "X bulan yang lalu"', () => {
    const d = parseRelativeDate('5 bulan yang lalu');
    const diff = Date.now() - d.getTime();
    expect(diff).toBeGreaterThan(4 * 30 * 24 * 60 * 60 * 1000);
    expect(diff).toBeLessThan(6 * 31 * 24 * 60 * 60 * 1000);
  });

  it('parses Indonesian "X tahun yang lalu"', () => {
    const d = parseRelativeDate('2 tahun yang lalu');
    const diff = Date.now() - d.getTime();
    expect(diff).toBeGreaterThan(2 * 365 * 24 * 60 * 60 * 1000 - 86400000);
    expect(diff).toBeLessThan(2 * 366 * 24 * 60 * 60 * 1000 + 86400000);
  });

  it('returns current date for empty string', () => {
    const d = parseRelativeDate('');
    const diff = Date.now() - d.getTime();
    expect(diff).toBeLessThan(1000);
  });

  it('returns current date for unrecognized text', () => {
    const d = parseRelativeDate('random text');
    const diff = Date.now() - d.getTime();
    expect(diff).toBeLessThan(1000);
  });

  it('parses abbreviated Indonesian "h" (hari)', () => {
    const d = parseRelativeDate('1 h lalu');
    const diff = Date.now() - d.getTime();
    expect(diff).toBeGreaterThan(0);
    expect(diff).toBeLessThan(48 * 60 * 60 * 1000);
  });

  it('parses abbreviated Indonesian "mgg" (minggu)', () => {
    const d = parseRelativeDate('2 mgg lalu');
    const diff = Date.now() - d.getTime();
    expect(diff).toBeGreaterThan(13 * 24 * 60 * 60 * 1000);
    expect(diff).toBeLessThan(15 * 24 * 60 * 60 * 1000);
  });

  it('parses abbreviated Indonesian "bln" (bulan)', () => {
    const d = parseRelativeDate('3 bln lalu');
    const diff = Date.now() - d.getTime();
    expect(diff).toBeGreaterThan(2 * 30 * 24 * 60 * 60 * 1000);
    expect(diff).toBeLessThan(4 * 31 * 24 * 60 * 60 * 1000);
  });

  it('parses abbreviated Indonesian "thn" (tahun)', () => {
    const d = parseRelativeDate('2 thn lalu');
    const diff = Date.now() - d.getTime();
    expect(diff).toBeGreaterThan(2 * 365 * 24 * 60 * 60 * 1000 - 86400000);
    expect(diff).toBeLessThan(2 * 366 * 24 * 60 * 60 * 1000 + 86400000);
  });
});

const TEST_CHANNELS = [
  '@Fireship',
  '@SMii7Y',
  '@gigguk',
  '@Theo',
  '@MKBHD',
  '@LinusTechTips',
  '@TomScottGo',
  '@Veritasium',
  '@BBCNews',
  '@Vox',
  '@MrBeast',
  '@Kurzgesagt',
];

describe('fetchYouTubeFallback integration', () => {
  for (const channel of TEST_CHANNELS) {
    it(`scrapes videos from ${channel}`, async () => {
      const videos = await fetchYouTubeFallback([{ channel }], 5, false);
      expect(Array.isArray(videos)).toBe(true);
      expect(videos.length).toBeGreaterThan(0);
      expect(videos.length).toBeLessThanOrEqual(5);
      for (const v of videos) {
        console.log(
          `  ${v.title.slice(0, 50).padEnd(50)} pubDate=${v.pubDate.toISOString()} channelTitle=${v.channelTitle}`,
        );
        expect(v.title.length).toBeGreaterThan(0);
        expect(v.videoId.length).toBeGreaterThan(0);
        expect(v.pubDate instanceof Date).toBe(true);
        expect(Number.isNaN(v.pubDate.getTime())).toBe(false);
        expect(v.pubDate.getTime()).toBeGreaterThan(new Date('2005-01-01').getTime());
        expect(v.pubDate.getTime()).toBeLessThan(Date.now() - 5000);
        expect(v.channelTitle.length).toBeGreaterThan(0);
        expect(v.channelTitle).not.toMatch(/^UC/);
        expect(v.channelTitle).not.toMatch(/^@/);
        expect(v.thumbnail).toContain('img.youtube.com');
      }
    }, 30000);
  }

  for (const channel of TEST_CHANNELS.slice(0, 3)) {
    it(`scrapes videos + shorts from ${channel}`, async () => {
      const videos = await fetchYouTubeFallback([{ channel }], 10, true);
      expect(videos.length).toBeGreaterThan(0);
      expect(videos.length).toBeLessThanOrEqual(10);
    }, 30000);
  }

  it('scrapes multiple channels at once', async () => {
    const videos = await fetchYouTubeFallback(toChannels(TEST_CHANNELS.slice(0, 3)), 15, false);
    expect(videos.length).toBeGreaterThan(0);
    expect(videos.length).toBeLessThanOrEqual(15);
  }, 60000);
});

describe('parseYtInitialData with live data', () => {
  for (const channel of TEST_CHANNELS.slice(0, 3)) {
    it(`parses ytInitialData from ${channel}/videos`, async () => {
      const html = (await fetchURL(`https://www.youtube.com/${channel}/videos`)) as string;
      expect(html).toContain('ytInitialData');
      const data = parseYtInitialData(html);
      expect(data).toBeTypeOf('object');
      expect(data).toHaveProperty('contents');
    }, 30000);
  }
});

describe('extractVideosFromTab with live data', () => {
  for (const channel of TEST_CHANNELS.slice(0, 3)) {
    it(`extracts videos from ${channel}`, async () => {
      const html = (await fetchURL(`https://www.youtube.com/${channel}/videos`)) as string;
      const data = parseYtInitialData(html);
      const clean = channel.replace('@', '');
      const videos = extractVideosFromTab(data, clean);
      expect(videos.length).toBeGreaterThan(0);
      for (const v of videos) {
        expect(v).toHaveProperty('title');
        expect(v).toHaveProperty('videoId');
        expect(v).toHaveProperty('pubDate');
        expect(v).toHaveProperty('channelTitle');
      }
    }, 30000);
  }
});

describe('extractChannelName', () => {
  for (const channel of TEST_CHANNELS.slice(0, 3)) {
    it(`extracts real channel name from ${channel}`, async () => {
      const html = (await fetchURL(`https://www.youtube.com/${channel}/videos`)) as string;
      const data = parseYtInitialData(html);
      const name = extractChannelName(data);
      expect(name).toBeTruthy();
      expect(typeof name).toBe('string');
      expect(name!.length).toBeGreaterThan(0);
      expect(name).not.toMatch(/^UC/);
    }, 30000);
  }

  it('returns null for invalid data', () => {
    expect(extractChannelName(null)).toBeNull();
    expect(extractChannelName({})).toBeNull();
  });
});

describe('YouTube primary API', () => {
  it('fetchYouTube is a function', async () => {
    const { fetchYouTube } = await import('./youtube');
    expect(typeof fetchYouTube).toBe('function');
  });
});
