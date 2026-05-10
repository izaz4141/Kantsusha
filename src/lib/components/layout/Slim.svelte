<script lang="ts">
  import { onMount } from 'svelte';
  import { uiState } from '$lib/stores/global.svelte';
  import type { LayoutProps } from '$lib/types/layout';

  let { panels }: LayoutProps = $props();

  onMount(() => {
    uiState.layoutType = 'slim';
    uiState.numPanel = 1;
  });
</script>

<div class="mx-auto flex flex-col gap-y-2 md:w-4/5">
  {#each panels.slice(0, 1) as panel, i (i)}
    {@render panel.content(i)}
  {/each}
</div>
