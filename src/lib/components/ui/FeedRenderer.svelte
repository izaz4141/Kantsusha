<script lang="ts">
  import type { Snippet } from 'svelte';
  import ListView from '$lib/components/ui/ListView.svelte';
  import CardView from '$lib/components/ui/CardView.svelte';

  interface Props {
    view?: 'list' | 'card';
    showThumbnail?: boolean;
    collapseAfter?: number;
    thumbnails: string[];
    details: Snippet<[index: number]>;
    class?: string;
  }

  let {
    view = 'list',
    showThumbnail = false,
    collapseAfter = 5,
    thumbnails,
    details,
    class: className = '',
  }: Props = $props();
</script>

{#if view === 'card'}
  <CardView {thumbnails} {details} class={className} />
{:else if view === 'list'}
  <ListView {showThumbnail} {collapseAfter} {thumbnails} {details} class={className} />
{/if}
