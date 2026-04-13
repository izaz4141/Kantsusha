<script lang="ts">
  import { slide } from 'svelte/transition';
  import type { Snippet } from 'svelte';

  interface Props {
    showThumbnail?: boolean;
    collapseAfter?: number;
    thumbnails: string[];
    details: Snippet<[index: number]>;
    class?: string;
  }

  let {
    showThumbnail = false,
    collapseAfter = 5,
    thumbnails,
    details,
    class: className = '',
  }: Props = $props();

  let expanded = $state(false);
  let visibleCount = $derived(
    expanded ? thumbnails.length : Math.min(collapseAfter, thumbnails.length),
  );
  let hasMore = $derived(collapseAfter < thumbnails.length);
</script>

<div class="rounded-lg border border-border bg-surface p-4 {className}">
  {#if thumbnails.length === 0}
    <div class="flex items-center justify-center py-4" transition:slide={{ duration: 300 }}>
      <span class="text-text-muted">No items found</span>
    </div>
  {:else}
    <ul class="space-y-3" transition:slide={{ duration: 300 }}>
      {#each thumbnails.slice(0, visibleCount) as _, i (`feed_${i}`)}
        <li class="group flex h-14 items-center gap-2 rounded" transition:slide={{ duration: 300 }}>
          {#if showThumbnail}
            <div class="hidden h-full w-1/10 rounded md:flex">
              {#if thumbnails[i] !== ''}
                <img
                  src={thumbnails[i]}
                  alt=""
                  class="object-cover brightness-80 transition-all group-hover:brightness-100"
                />
              {/if}
            </div>
          {/if}
          <div class="w-9/10 flex-1">
            {@render details(i)}
          </div>
        </li>
      {/each}
    </ul>
    {#if hasMore}
      <button
        type="button"
        class="mt-3 flex items-center justify-center gap-2 text-sm text-text-muted transition-colors hover:text-text"
        onclick={() => (expanded = !expanded)}
      >
        <span>{expanded ? 'SHOW LESS' : 'SHOW MORE'}</span>
        <svg
          class="h-4 w-4 shrink-0 transition-transform {expanded ? 'rotate-180' : ''}"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>
    {/if}
  {/if}
</div>
