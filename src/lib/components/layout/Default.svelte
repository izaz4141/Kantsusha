<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { browser } from '$app/environment';
  import { uiState } from '$lib/stores/global.svelte';
  import type { LayoutProps } from '$lib/types/layout';

  let { panels, currentPanel = $bindable(0) }: LayoutProps = $props();

  let handler: ((e: Event) => void) | undefined;

  function getPanelStyle(size: string): string {
    if (size === 'small') return 'width: 300px; flex: none;';
    if (size === 'full') return 'flex: 1;';
    return `width: ${size}; flex: none;`;
  }
  // Don't remove this, its used
  let dynamicStyles = $derived(
    panels.map((panel, i) => `.panel-${i} { ${getPanelStyle(panel.size)} }`).join(' '),
  );

  onMount(() => {
    uiState.layoutType = 'default';
    uiState.numPanel = panels.length;

    if (!browser) return;
    handler = (e: Event) => {
      const customEvent = e as CustomEvent<number>;
      currentPanel = customEvent.detail;
    };
    window.addEventListener('navigate-panel', handler as EventListener);
  });

  onDestroy(() => {
    if (handler) {
      window.removeEventListener('navigate-panel', handler);
    }
  });
</script>

{@html `<style>
  @media (width >= 48rem) {
    ${dynamicStyles}
  }
</style>`}

<div class="flex h-full w-full md:gap-x-4">
  {#each panels as panel, i (i)}
    <div
      class="flex h-full w-full flex-col gap-y-4 panel-{i}"
      class:hidden={currentPanel !== i}
      class:md:flex={true}
    >
      {@render panel.content(i)}
    </div>
  {/each}
</div>
