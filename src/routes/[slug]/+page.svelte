<script lang="ts">
  import Default from '$lib/components/layout/Default.svelte';
  import ThreePanel from '$lib/components/layout/ThreePanel.svelte';
  import Slim from '$lib/components/layout/Slim.svelte';
  import WidgetRenderer from '$lib/components/ui/WidgetRenderer.svelte';
  import {
    WrapperWidgetParamsSchema,
    type WrapperWidgetParams,
    type BaseWidgetParams,
  } from '$lib/types/widget.params';
  import type { LayoutProps } from '$lib/types/layout';
  import type { PageData } from './$types';
  import type { Component } from 'svelte';
  import WrapperWidgetRenderer from '$lib/components/ui/WrapperWidgetRenderer.svelte';

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

<svelte:head>
  <title>{data.page.name.trim()} - Kantsusha</title>
</svelte:head>

{#snippet renderColumn(colIndex: number)}
  {#if columns[colIndex]}
    {#each columns[colIndex].widgets as widget, wIdx (`${colIndex}:${wIdx}`)}
      {@const wid = getWidgetId(colIndex, wIdx)}
      {#if wid != ''}
        {#if WrapperWidgetParamsSchema.options.some((o) => o.shape.type.value == widget.type)}
          <WrapperWidgetRenderer id={wid} type={widget.type as WrapperWidgetParams['type']} />
        {:else}
          <WidgetRenderer id={wid} type={widget.type as BaseWidgetParams['type']} />
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
