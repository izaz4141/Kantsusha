<script lang="ts">
  import type { BaseWidgetInfo, MarketData } from '$lib/types/widget.data';
  import { getCurrencySymbol } from '$lib/utils/substitution';

  interface Props {
    result: BaseWidgetInfo;
    class?: string;
  }

  let { result, class: className = '' }: Props = $props();

  let data = $derived(result.data as MarketData[]);

  let hoveredMarket = $state<number | null>(null);
  let hoveredBarIdx = $state<number | null>(null);

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

  function formatTimestamp(ts: number): string {
    return new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  function getBars(
    prices: number[],
    width: number,
    height: number,
  ): { x: number; y: number; w: number; h: number; color: string }[] {
    if (prices.length < 2) return [];

    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const range = max - min || 1;
    const count = prices.length - 1;
    const intervalWidth = width / count;
    const gap = intervalWidth * 0.25;

    const bars: { x: number; y: number; w: number; h: number; color: string }[] = [];

    for (let i = 0; i < count; i++) {
      const y0 = height - ((prices[i] - min) / range) * height;
      const y1 = height - ((prices[i + 1] - min) / range) * height;
      bars.push({
        x: i * intervalWidth + gap / 2,
        y: Math.min(y0, y1),
        w: intervalWidth - gap,
        h: Math.abs(y1 - y0),
        color: prices[i + 1] >= prices[i] ? 'var(--color-success)' : 'var(--color-error)',
      });
    }

    return bars;
  }

  function handleMouseMove(e: MouseEvent, prices: number[], marketIdx: number) {
    const svg = e.currentTarget as SVGSVGElement;
    const rect = svg.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const viewBoxX = (mouseX / rect.width) * 100;
    const intervalWidth = 100 / (prices.length - 1);
    const idx = Math.min(Math.floor(viewBoxX / intervalWidth), prices.length - 2);

    if (idx >= 0) {
      hoveredBarIdx = idx;
      hoveredMarket = marketIdx;
    }
  }

  function handleMouseLeave() {
    hoveredMarket = null;
    hoveredBarIdx = null;
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
        {@const bars = getBars(market.prices, 100, 40)}
        <li class="relative flex h-18 items-center justify-between rounded-lg bg-surface/40 p-3">
          <svg
            class="absolute inset-0 h-full w-full"
            preserveAspectRatio="none"
            viewBox="0 0 100 40"
            role="img"
            onmousemove={(e) => handleMouseMove(e, market.prices, i)}
            onmouseleave={handleMouseLeave}
          >
            {#each bars as bar, j (`bar_${j}`)}
              <rect
                x={bar.x}
                y={bar.y}
                width={bar.w}
                height={bar.h}
                fill={bar.color}
                rx="0.3"
                opacity={hoveredMarket === null || hoveredMarket !== i
                  ? 0.35
                  : hoveredBarIdx === j
                    ? 0.85
                    : 0.2}
              />
            {/each}
          </svg>

          {#if hoveredMarket === i && hoveredBarIdx !== null && bars.length > 0}
            {@const bar = bars[hoveredBarIdx]}
            {@const price = market.prices[hoveredBarIdx + 1]}
            {@const prevPrice = market.prices[hoveredBarIdx]}
            {@const pctChange = prevPrice !== 0 ? ((price - prevPrice) / prevPrice) * 100 : 0}
            <div
              class="pointer-events-none absolute z-10 rounded-md border border-border bg-surface px-2 py-1 text-xs shadow-lg"
              style="left: {bar.x + bar.w / 2}%; bottom: calc({((40 - bar.y) / 40) *
                100}% + 4px); transform: translateX(-50%);"
            >
              <div class="flex flex-col gap-0.5 whitespace-nowrap">
                <span class="font-mono font-semibold" style="color: {bar.color};">
                  {formatPrice(price, market.currency)}
                </span>
                <span class="text-text-muted"
                  >{formatTimestamp(market.timestamps[hoveredBarIdx + 1])}</span
                >
                <span
                  class="font-mono"
                  style="color: {pctChange >= 0 ? 'var(--color-success)' : 'var(--color-error)'};"
                >
                  {formatPercent(pctChange)}
                </span>
              </div>
            </div>
          {/if}

          <div class="pointer-events-none relative flex flex-col justify-start">
            <span class="font-mono text-sm font-semibold text-text">{market.code}</span>
            <span class="text-xs text-text-muted">{market.displayName}</span>
          </div>

          <div class="pointer-events-none relative flex flex-col items-end justify-end">
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
