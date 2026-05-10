<script lang="ts">
  import Default from '$lib/components/layout/Default.svelte';
  import ThreePanel from '$lib/components/layout/ThreePanel.svelte';
  import Slim from '$lib/components/layout/Slim.svelte';
  import WidgetRenderer from '$lib/components/ui/WidgetRenderer.svelte';
  import Tabbed from '$lib/components/ui/Tabbed.svelte';
  import type { LayoutProps } from '$lib/types/layout';
  import type { PageData } from './$types';
  import type { Component } from 'svelte';

  let { data }: { data: PageData } = $props();

  function getWidgetId(colIndex: number, widgetIndex: number): string {
    return data.widgetIds[colIndex]?.[widgetIndex] ?? '';
  }

  let columns = $derived(data.page.columns);

  const layouts: Record<string, Component<LayoutProps, object, 'currentPanel' | ''>> = {
    default: Default,
    'three-panel': ThreePanel,
    slim: Slim,
  };

  let Layout = $derived(layouts[data.page.layout] ?? Default);
</script>

{#snippet renderColumn(colIndex: number)}
  {#if columns[colIndex]}
    {#each columns[colIndex].widgets as widget, wIdx (`${colIndex}:${wIdx}`)}
      {@const wid = getWidgetId(colIndex, wIdx)}
      {#if wid}
        {#if widget.type === 'tabbed'}
          <Tabbed id={wid} />
        {:else}
          <WidgetRenderer id={wid} type={widget.type} />
        {/if}
      {/if}
    {/each}
  {/if}
{/snippet}

<Layout
  panels={columns.map(({ size }) => ({
    size,
    content: renderColumn,
  }))}
/>
