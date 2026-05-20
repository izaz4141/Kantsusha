<script lang="ts">
  import type { BaseWidgetInfo, MarketData } from '$lib/types/widget.data';
  import { getCurrencySymbol } from '$lib/utils/substitution';

  interface Props {
    result: BaseWidgetInfo;
    class?: string;
  }

  let { result, class: className = '' }: Props = $props();

  let data = $derived(result.data as MarketData[]);

  function formatPrice(price: number, currency: string): string {
    const symbol = getCurrencySymbol(currency);
    if (price < 1) {
      return `${symbol}${price.toFixed(4)}`;
    }
    return `${symbol}${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  function formatPercent(percent: number): string {
    const sign = percent >= 0 ? '+' : '';
    return `${sign}${percent.toFixed(2)}%`;
  }

  function getChartSegments(
    prices: number[],
    width: number,
    height: number,
  ): { x1: number; y1: number; x2: number; y2: number; color: string }[] {
    if (prices.length < 2) return [];

    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const range = max - min || 1;

    const points = prices.map((price, idx) => ({
      x: (idx / (prices.length - 1)) * width,
      y: height - ((price - min) / range) * height,
    }));

    const segments: { x1: number; y1: number; x2: number; y2: number; color: string }[] = [];
    for (let i = 0; i < points.length - 1; i++) {
      const up = prices[i + 1] >= prices[i];
      segments.push({
        x1: points[i].x,
        y1: points[i].y,
        x2: points[i + 1].x,
        y2: points[i + 1].y,
        color: up ? 'var(--color-success)' : 'var(--color-error)',
      });
    }

    return segments;
  }
</script>

<div class={className}>
  {#if data.length === 0}
    <div class="flex items-center justify-center py-4">
      <span class="text-text-muted">No market data available</span>
    </div>
  {:else}
    <ul class="flex flex-col gap-y-2">
      {#each data as market, i (i)}
        {@const lineColor =
          market.changePercent >= 0 ? 'var(--color-success)' : 'var(--color-error)'}
        {@const segments = getChartSegments(market.prices, 100, 40)}
        <li class="relative flex h-18 items-center justify-between rounded-lg bg-surface/40 p-3">
          <svg
            class="absolute inset-0 h-full w-full opacity-30"
            preserveAspectRatio="none"
            viewBox="0 0 100 40"
            aria-hidden="true"
          >
            {#each segments as segment, i (`segment_${i}`)}
              <line
                x1={segment.x1}
                y1={segment.y1}
                x2={segment.x2}
                y2={segment.y2}
                stroke={segment.color}
                stroke-width="1.5"
                stroke-linecap="round"
              />
            {/each}
          </svg>

          <div class="relative flex flex-col justify-start">
            <span class="font-mono text-sm font-semibold text-text">{market.code}</span>
            <span class="text-xs text-text-muted">{market.displayName}</span>
          </div>

          <div class="relative flex flex-col items-end justify-end">
            <span class="font-mono text-sm font-semibold" style="color: {lineColor};">
              {formatPercent(market.changePercent)}
            </span>
            <span class="text-xs text-text-muted">
              {formatPrice(market.currentPrice, market.currency)}
            </span>
          </div>
        </li>
      {/each}
    </ul>
  {/if}
</div>
