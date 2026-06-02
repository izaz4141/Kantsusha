<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { slide } from 'svelte/transition';
  import CalendarWidget from '$lib/components/widgets/CalendarWidget.svelte';
  import RssWidget from '$lib/components/widgets/feeds/RssWidget.svelte';
  import RedditWidget from '$lib/components/widgets/feeds/RedditWidget.svelte';
  import YouTubeWidget from '$lib/components/widgets/feeds/YouTubeWidget.svelte';
  import TwitchChannelWidget from '$lib/components/widgets/TwitchChannelWidget.svelte';
  import ServicesWidget from '$lib/components/widgets/ServicesWidget.svelte';
  import CustomApiWidget from '$lib/components/widgets/CustomApiWidget.svelte';
  import MarketsWidget from '$lib/components/widgets/MarketsWidget.svelte';
  import ServerStatsWidget from '$lib/components/widgets/ServerStatsWidget.svelte';
  import type { BaseWidgetInfo } from '$lib/types/widget.data';
  import Dropdown from '$lib/components/ui/Dropdown.svelte';
  import PulseLoader from '$lib/components/shared/PulseLoader.svelte';
  import { fetchURL } from '$lib/utils/network';
  import { timeToMs } from '$lib/utils/time';
  import type { BaseWidgetParams } from '$lib/types/widget.params';

  interface Props {
    id: string;
    type: BaseWidgetParams['type'];
    update?: number;
    showTitle?: boolean;
    refreshSignal?: number;
    onErrors?: (errors: string[]) => void;
  }

  let {
    id,
    type,
    update = 2 * 60 * 60 * 1000,
    showTitle = true,
    refreshSignal = 0,
    onErrors,
  }: Props = $props();

  let loading = $state(true);
  let error = $state<string | null>(null);
  let widgetInfo = $state<BaseWidgetInfo | null>(null);
  let widgetTitle = $state<string | null>(null);
  let intervalId: ReturnType<typeof setInterval> | null = null;
  let reloading = $state(false);
  let errorTrigger = $state<HTMLElement>();
  let errorOpen = $state(false);

  $effect(() => {
    if (refreshSignal === 0) return;
    fetchWidgetInfo(false);
  });

  $effect(() => {
    onErrors?.(widgetInfo?.errors ?? []);
  });

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
    <span class="text-sm font-medium text-text uppercase">
      {widgetTitle}
      {#if widgetInfo?.errors?.length}
        <div
          bind:this={errorTrigger}
          class="inline-flex text-error"
          role="status"
          aria-label="Widget Warning"
          onmouseenter={() => (errorOpen = true)}
          onmouseleave={() => (errorOpen = false)}
        >
          ⚠
        </div>
        <Dropdown bind:open={errorOpen} trigger={errorTrigger} targetPortal="portal-root">
          {#each widgetInfo.errors as err (err)}
            <div class="px-2 py-1 text-xs whitespace-nowrap text-error">{err}</div>
          {/each}
        </Dropdown>
      {/if}
    </span>
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

<div class={widgetInfo?.params.frameless ? '' : 'rounded-lg border border-border bg-surface p-4'}>
  {#if loading}
    <PulseLoader />
  {:else if error}
    <div
      class="flex items-center justify-center gap-2 rounded border border-error/30 bg-error/10 px-3 py-4"
      transition:slide={{ duration: 300 }}
    >
      <span class="text-error">⚠</span>
      <span class="text-sm text-error">{error}</span>
    </div>
  {:else if type === 'calendar' && widgetInfo}
    <CalendarWidget result={widgetInfo} />
  {:else if type === 'rss' && widgetInfo}
    <RssWidget result={widgetInfo} />
  {:else if type === 'reddit' && widgetInfo}
    <RedditWidget result={widgetInfo} />
  {:else if type === 'youtube' && widgetInfo}
    <YouTubeWidget result={widgetInfo} />
  {:else if type === 'twitch-channel' && widgetInfo}
    <TwitchChannelWidget result={widgetInfo} />
  {:else if type === 'services' && widgetInfo}
    <ServicesWidget result={widgetInfo} />
  {:else if type === 'custom-api' && widgetInfo}
    <CustomApiWidget result={widgetInfo} />
  {:else if type === 'markets' && widgetInfo}
    <MarketsWidget result={widgetInfo} />
  {:else if type === 'server-stats' && widgetInfo}
    <ServerStatsWidget result={widgetInfo} />
  {/if}
</div>
