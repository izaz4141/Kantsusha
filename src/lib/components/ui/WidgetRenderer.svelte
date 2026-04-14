<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { slide } from 'svelte/transition';
  import CalendarWidget from '$lib/components/widgets/CalendarWidget.svelte';
  import RssWidget from '$lib/components/widgets/RssWidget.svelte';
  import RedditWidget from '$lib/components/widgets/RedditWidget.svelte';
  import DockerContainersWidget from '$lib/components/widgets/DockerContainersWidget.svelte';
  import type { BaseWidgetInfo } from '$lib/types/widget.data';
  import { fetchURL } from '$lib/utils/network';
  import { timeToMs } from '$lib/utils/time';

  interface Props {
    id: string;
    type: string;
    update?: number;
    showTitle?: boolean;
  }

  let { id, type, update = 2 * 60 * 60 * 1000, showTitle = true }: Props = $props();

  let loading = $state(true);
  let error = $state<string | null>(null);
  let widgetInfo = $state<BaseWidgetInfo | null>(null);
  let widgetTitle = $state<string | null>(null);
  let intervalId: ReturnType<typeof setInterval> | null = null;
  let reloading = $state(false);

  async function fetchWidgetInfo(isInitial = false) {
    if (isInitial) {
      loading = true;
      widgetInfo = null;
      widgetTitle = null;
    }
    error = null;
    try {
      const result = await fetchURL(`/api/v1/widgets/${id}`, { returnText: false });
      widgetInfo = result as BaseWidgetInfo;
      widgetTitle = widgetInfo.params.title ?? null;
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
    await fetchWidgetInfo(false);
    reloading = false;
  }

  onMount(async () => {
    await fetchWidgetInfo(true);
    update = widgetInfo?.params.update ? (timeToMs(widgetInfo.params.update) ?? update) : update;
    if (update && update > 0) {
      intervalId = setInterval(() => fetchWidgetInfo(false), update);
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
{:else if type === 'calendar' && widgetInfo}
  <CalendarWidget result={widgetInfo} />
{:else if type === 'rss' && widgetInfo}
  <RssWidget result={widgetInfo} />
{:else if type === 'reddit' && widgetInfo}
  <RedditWidget result={widgetInfo} />
{:else if type === 'docker-containers' && widgetInfo}
  <DockerContainersWidget result={widgetInfo} />
{/if}
