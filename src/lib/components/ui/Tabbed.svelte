<script lang="ts">
  import { onMount } from 'svelte';
  import WidgetRenderer from './WidgetRenderer.svelte';
  import type { AnyWidget } from '$lib/server/config/widget';
  import { fetchURL } from '$lib/utils/network';

  interface Props {
    id: string;
  }

  let { id }: Props = $props();

  let loading = $state(true);
  let error = $state<string | null>(null);
  let tabData = $state<{ ids: string[]; widgets: AnyWidget[] } | null>(null);
  let active = $state(0);

  async function fetchTabbedData() {
    loading = true;
    error = null;
    try {
      const result = await fetchURL(`/api/v1/widgets/${id}`, { returnText: false });
      tabData = { ids: result.data.ids, widgets: result.params.widgets };
    } catch (e) {
      error = e instanceof Error ? e.message : 'Failed to load tabs';
    } finally {
      loading = false;
    }
  }

  onMount(() => {
    fetchTabbedData();
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
  <div class="flex flex-row">
    {#each tabData.widgets as widget, i (`${widget.type}_${i}`)}
      <button
        type="button"
        class="mx-2 flex text-sm font-medium uppercase {active === i
          ? 'border-b border-dotted border-text-muted text-text'
          : 'text-text-muted'} hover:text-text"
        onclick={() => (active = i)}
      >
        {widget.title ?? 'N/A'}
      </button>
    {/each}
  </div>
  {#each tabData.ids as _, i (i)}
    <div class:hidden={active !== i}>
      <WidgetRenderer id={tabData.ids[i]} type={tabData.widgets[i].type} showTitle={false} />
    </div>
  {/each}
{/if}
