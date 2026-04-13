<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { slide } from 'svelte/transition';
  import CalendarWidget from '$lib/components/widgets/CalendarWidget.svelte';
  import RssWidget from '$lib/components/widgets/RssWidget.svelte';
  import RedditWidget from '$lib/components/widgets/RedditWidget.svelte';
  import type { WidgetData } from '$lib/types/widget.data';
  import { fetchURL } from '$lib/utils/network';
  import { timeToMs } from '$lib/utils/time';

  interface Props {
    id: string;
    type: string;
    update?: number;
    showTitle?: boolean;
  }

  let { id, type, update = 2 * 60 * 60 * 1000, showTitle = true }: Props = $props();

  let timer = $state(Date.now());
  let loading = $state(true);
  let error = $state<string | null>(null);
  let widgetData = $state<WidgetData | null>(null);
  let widgetTitle = $state<string | null>(null);
  let intervalId: ReturnType<typeof setInterval> | null = null;
  let reloading = $state(false);

  async function fetchWidgetData(isInitial = false) {
    if (isInitial) {
      loading = true;
      error = null;
      widgetData = null;
      widgetTitle = null;
    }
    try {
      const result = await fetchURL(`/api/v1/widgets/${id}`, { returnText: false });
      widgetData = result;
      widgetTitle = result.params?.title ?? null;
    } catch (e) {
      if (isInitial) {
        error = e instanceof Error ? e.message : 'Failed to load data';
      }
    } finally {
      if (isInitial) {
        loading = false;
      }
    }
  }

  async function reload() {
    reloading = true;
    await fetchWidgetData(false);
    reloading = false;
  }

  onMount(async () => {
    await fetchWidgetData(true);
    update = widgetData?.params?.update ? (timeToMs(widgetData.params.update) ?? update) : update;
    if (update && update > 0) {
      intervalId = setInterval(() => fetchWidgetData(false), update);
    }
  });

  onDestroy(() => {
    if (intervalId) clearInterval(intervalId);
  });
</script>

{#if showTitle && widgetTitle}
  <div class="mx-2 flex items-center justify-between">
    <span class="text-sm font-medium text-text uppercase">{widgetTitle}</span>
    <button
      onclick={reload}
      class="text-text-muted transition-colors hover:text-text"
      disabled={reloading}
      aria-label="Reload data"
    >
      <span class:animate-spin={reloading}>↻</span>
    </button>
  </div>
{/if}

{#if loading}
  <div class=" flex items-center justify-center rounded-lg border border-border bg-surface p-4">
    <span class="text-text-muted">Loading widget...</span>
  </div>
{:else if error}
  <div
    class="flex items-center justify-center rounded-lg border border-border bg-surface p-4"
    transition:slide={{ duration: 300 }}
  >
    <span class="text-error">{error}</span>
  </div>
{:else if type === 'calendar' && widgetData}
  <CalendarWidget result={widgetData} />
{:else if type === 'rss' && widgetData}
  <RssWidget result={widgetData} />
{:else if type === 'reddit' && widgetData}
  <RedditWidget result={widgetData} />
{/if}
