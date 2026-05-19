<script lang="ts">
  import { onMount } from 'svelte';
  import WidgetRenderer from './WidgetRenderer.svelte';
  import PulseLoader from '$lib/components/shared/PulseLoader.svelte';
  import { fetchURL } from '$lib/utils/network';
  import type { WrapperWidgetData, AnyWidgetInfo } from '$lib/types/widget.data';
  import {
    type SplitRowParams,
    type WrapperWidgetEntry,
    type WrapperWidgetParams,
    type BaseWidgetParams,
    WrapperWidgetParamsSchema,
  } from '$lib/types/widget.params';
  import WrapperWidgetRenderer from './WrapperWidgetRenderer.svelte';

  interface Props {
    id: string;
  }

  let { id }: Props = $props();

  let loading = $state(true);
  let error = $state<string | null>(null);
  let splitData = $state<WrapperWidgetData | null>(null);
  let splitParams = $state<SplitRowParams | null>(null);
  let widgets = $derived(splitParams?.widgets as WrapperWidgetEntry[]);
  let reloading = $state(false);

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
      splitParams = result.params as SplitRowParams;
    } catch (e) {
      error = e instanceof Error ? e.message : 'Failed to load rows';
    } finally {
      loading = false;
    }
  }

  async function reload() {
    reloading = true;
    await fetchSplitData();
    reloading = false;
  }

  onMount(async () => {
    await fetchSplitData(true);
  });
</script>

{#if loading}
  <div class="flex items-center justify-center rounded-lg border border-border bg-surface">
    <PulseLoader message="Loading rows..." />
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
        aria-label="Reload rows"
      >
        <span class:animate-spin={reloading}>↻</span>
      </button>
    </div>
  {/if}
  <div class="flex flex-col gap-y-4">
    {#each splitData.ids as _, i (i)}
      {#if WrapperWidgetParamsSchema.options.some((o) => o.shape.type.value == widgets[i].type)}
        <WrapperWidgetRenderer
          id={splitData.ids[i]}
          type={widgets[i].type as WrapperWidgetParams['type']}
        />
      {:else}
        <WidgetRenderer
          id={splitData.ids[i]}
          type={widgets[i].type as BaseWidgetParams['type']}
          showTitle={false}
        />
      {/if}
    {/each}
  </div>
{/if}
