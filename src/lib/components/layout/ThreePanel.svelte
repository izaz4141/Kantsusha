<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { browser } from '$app/environment';
  import { uiState } from '$lib/stores/global.svelte';
  import type { LayoutProps } from '$lib/types/layout';

  let { panels, currentPanel = $bindable(0) }: LayoutProps = $props();

  let handler: ((e: Event) => void) | undefined;

  onMount(() => {
    uiState.layoutType = 'three-panel';
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

<div class="flex h-full w-full md:gap-x-4">
  {#each panels.slice(0, 3) as panel, i (i)}
    <div
      class="flex h-full w-full flex-col gap-y-4"
      class:hidden={currentPanel !== i}
      class:md:w-[25%]={i === 0 || i === 2}
      class:md:w-[50%]={i === 1}
      class:md:flex={true}
      class:md:flex-col={true}
    >
      {@render panel.content(i)}
    </div>
  {/each}
</div>
