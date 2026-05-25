<script lang="ts">
  import { onMount } from 'svelte';
  import WidgetRenderer from './WidgetRenderer.svelte';
  import PulseLoader from '$lib/components/shared/PulseLoader.svelte';
  import { fetchURL } from '$lib/utils/network';
  import type { WrapperWidgetData, AnyWidgetInfo } from '$lib/types/widget.data';
  import {
    type SplitColumnParams,
    type WrapperWidgetEntry,
    type BaseWidgetParams,
    type WrapperWidgetParams,
    WrapperWidgetParamsSchema,
  } from '$lib/types/widget.params';
  import WrapperWidgetRenderer from './WrapperWidgetRenderer.svelte';

  interface Props {
    id: string;
    refreshSignal?: number;
  }

  let { id, refreshSignal = 0 }: Props = $props();

  let loading = $state(true);
  let error = $state<string | null>(null);
  let splitData = $state<WrapperWidgetData | null>(null);
  let splitParams = $state<SplitColumnParams | null>(null);
  let widgets = $derived(splitParams?.widgets as WrapperWidgetEntry[]);
  let reloading = $state(false);
  let childRefreshSignal = $state(0);

  $effect(() => {
    if (refreshSignal === 0) return;
    childRefreshSignal = Date.now();
  });

  async function fetchSplitData(isInitial = false) {
    if (isInitial) {
      loading = true;
    }
    error = null;
    try {
      const result = (await fetchURL(`/api/v1/widgets/${id}`, {
        returnText: false,
      })) as AnyWidgetInfo;
      splitData = result.data as WrapperWidgetData;
      splitParams = result.params as SplitColumnParams;
    } catch (e) {
      error = e instanceof Error ? e.message : 'Failed to load columns';
    } finally {
      loading = false;
    }
  }

  async function reload() {
    reloading = true;
    await fetchSplitData();
    reloading = false;
    childRefreshSignal = Date.now();
  }

  function parsePercent(size: string | undefined): number {
    if (!size) return 0;
    const match = size.match(/^(\d+(\.\d+)?)%$/);
    return match ? parseFloat(match[1]) : 0;
  }

  let normalizedWidths = $derived(() => {
    if (!splitParams) return [];

    const sizes = widgets.map((w) => parsePercent(w.size));
    const sumSpecified = sizes.reduce((acc, s) => acc + s, 0);
    const numUnspecified = sizes.filter((s) => s === 0).length;
    const defaultWidth = numUnspecified > 0 ? (100 - sumSpecified) / numUnspecified : 0;

    return sizes.map((s) => (s === 0 ? defaultWidth : s));
  });

  onMount(async () => {
    await fetchSplitData(true);
  });
</script>

{#if loading}
  <div class="flex items-center justify-center rounded-lg border border-border bg-surface">
    <PulseLoader message="Loading columns..." />
  </div>
{:else if error}
  <div
    class="flex items-center justify-center gap-2 rounded-lg border border-error/30 bg-error/10 p-4"
  >
    <span class="text-error">⚠</span>
    <span class="text-sm text-error">{error}</span>
  </div>
{:else if splitData && splitParams}
  {#if splitParams?.title}
    <div class="mx-2 flex items-center justify-between">
      <span class="text-sm font-medium text-text uppercase">{splitParams.title}</span>
      <button
        onclick={reload}
        class="text-text-muted transition-colors hover:text-text"
        disabled={reloading}
        aria-label="Reload columns"
      >
        <span class:animate-spin={reloading}>↻</span>
      </button>
    </div>
  {/if}
  <div class="flex flex-row gap-x-4">
    {#each splitData.ids as _, i (i)}
      {@const width = normalizedWidths()[i]}
      <div style="width: {width}%;">
        {#if WrapperWidgetParamsSchema.options.some((o) => o.shape.type.value == widgets[i].type)}
          <WrapperWidgetRenderer
            id={splitData.ids[i]}
            type={widgets[i].type as WrapperWidgetParams['type']}
            refreshSignal={childRefreshSignal}
          />
        {:else}
          <WidgetRenderer
            id={splitData.ids[i]}
            type={widgets[i].type as BaseWidgetParams['type']}
            showTitle={splitParams?.title ? false : true}
            refreshSignal={childRefreshSignal}
          />
        {/if}
      </div>
    {/each}
  </div>
{/if}
