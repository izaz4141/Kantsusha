import { fetchURL } from '$lib/utils/network';
import type { MarketEntry } from '$lib/types/widget.params';
import type { MarketData } from '$lib/types/widget.data';

interface YahooChartResponse {
  chart: {
    result: Array<{
      meta: {
        regularMarketPrice: number;
        previousClose: number;
        currency?: string;
        shortName?: string;
        symbol: string;
      };
      timestamp: number[];
      indicators: {
        quote: Array<{
          close: Array<number | null>;
        }>;
      };
    }>;
    error: null;
  };
}

async function fetchYahooData(
  code: string,
  range: string,
  interval: string,
): Promise<MarketData | null> {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(code)}?interval=${interval}&range=${range}`;

  try {
    const response = (await fetchURL(url, { returnText: false })) as YahooChartResponse;
    const result = response.chart.result?.[0];

    if (!result) {
      console.error(`[Markets] No data for ${code}`);
      return null;
    }

    const meta = result.meta;
    const quotes = result.indicators.quote?.[0];
    const timestamps = result.timestamp ?? [];
    const closes = quotes?.close ?? [];

    const prices: number[] = [];
    const validTimestamps: number[] = [];

    for (let i = 0; i < closes.length; i++) {
      if (closes[i] !== null) {
        prices.push(closes[i] as number);
        validTimestamps.push(timestamps[i] * 1000);
      }
    }

    const currentPrice =
      meta.regularMarketPrice ?? (prices.length > 0 ? prices[prices.length - 1] : 0);
    const previousPrice = prices.length > 1 ? prices[prices.length - 2] : currentPrice;
    const changePercent =
      previousPrice !== 0 ? ((currentPrice - previousPrice) / previousPrice) * 100 : 0;

    const displayName = meta.shortName ?? code;
    const currency = meta.currency ?? '';

    return {
      code,
      displayName,
      currency,
      prices,
      timestamps: validTimestamps,
      currentPrice,
      changePercent,
      lastTimestamp:
        validTimestamps.length > 0 ? validTimestamps[validTimestamps.length - 1] : Date.now(),
    };
  } catch (err) {
    console.error(`Markets ${code}:`, err);
    return null;
  }
}

export async function fetchMarketData(markets: MarketEntry[]): Promise<MarketData[]> {
  const results = await Promise.all(
    markets.map(async (market) => {
      const data = await fetchYahooData(
        market.code,
        market.range ?? '30d',
        market.interval ?? '1d',
      );
      return data;
    }),
  );

  return results.filter((r): r is MarketData => r !== null);
}
