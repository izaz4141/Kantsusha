<script lang="ts">
  import { onMount } from 'svelte';
  import WidgetRenderer from './WidgetRenderer.svelte';
  import { fetchURL } from '$lib/utils/network';
  import type { TabbedData, AnyWidgetInfo } from '$lib/types/widget.data';

  interface Props {
    id: string;
  }

  let { id }: Props = $props();

  let loading = $state(true);
  let error = $state<string | null>(null);
  let tabData = $state<TabbedData | null>(null);
  let active = $state(0);
  let reloading = $state(false);

  async function fetchTabbedData(isInitial = false) {
    if (isInitial) {
      loading = true;
    }
    error = null;
    try {
      const result = (await fetchURL(`/api/v1/widgets/${id}`, {
        returnText: false,
      })) as AnyWidgetInfo;
      tabData = result.data as TabbedData;
    } catch (e) {
      error = e instanceof Error ? e.message : 'Failed to load tabs';
    } finally {
      loading = false;
    }
  }

  async function reload() {
    reloading = true;
    await fetchTabbedData();
    reloading = false;
  }

  onMount(() => {
    fetchTabbedData(true);
  });
</script>

{#if loading}
  <div class="flex items-center justify-center rounded-lg border border-border bg-surface p-4">
    <span class="text-text-muted">Loading tabs...</span>
  </div>
{:else if error}
  <div class="flex items-center justify-center rounded-lg border border-border bg-surface p-4">
    <span class="text-error">{error}</span>
  </div>
{:else if tabData}
  <div class="mx-2 flex flex-row items-center justify-between">
    <div class="flex flex-row gap-2 overflow-x-auto">
      {#each tabData.widgets as widget, i (`${widget.type}_${i}`)}
        <button
          type="button"
          class="flex shrink-0 text-sm font-medium uppercase {active === i
            ? 'border-b border-dotted border-text-muted text-text'
            : 'text-text-muted'} hover:text-text"
          onclick={() => (active = i)}
        >
          {widget.title ?? 'N/A'}
        </button>
      {/each}
    </div>
    <button
      onclick={reload}
      class="text-text-muted transition-colors hover:text-text"
      disabled={reloading}
      aria-label="Reload tabs"
    >
      <span class:animate-spin={reloading}>↻</span>
    </button>
  </div>
  {#each tabData.ids as _, i (i)}
    <div class:hidden={active !== i}>
      <WidgetRenderer id={tabData.ids[i]} type={tabData.widgets[i].type} showTitle={false} />
    </div>
  {/each}
{/if}
