<script lang="ts">
  import { slide } from 'svelte/transition';
  import type { Snippet } from 'svelte';

  interface Props {
    thumbnails: string[];
    details: Snippet<[index: number]>;
    class?: string;
  }

  let { thumbnails, details, class: className = '' }: Props = $props();
</script>

<div class={className}>
  {#if thumbnails.length === 0}
    <div class="flex items-center justify-center py-4" transition:slide={{ duration: 300 }}>
      <span class="text-text-muted">No items found</span>
    </div>
  {:else}
    <div
      class="scrollbar-thin -mb-2 flex gap-3 overflow-x-auto pb-2"
      transition:slide={{ duration: 300 }}
    >
      {#each thumbnails as _, i (`card_${i}`)}
        <div
          class="group transition-slide flex max-w-36 shrink-0 flex-col overflow-hidden rounded border border-border bg-surface md:max-w-40"
          transition:slide={{ duration: 300 }}
        >
          {#if thumbnails[i] !== ''}
            <div class="aspect-video w-full overflow-hidden">
              <img
                src={thumbnails[i]}
                alt=""
                class="h-full w-full object-cover brightness-80 transition-all group-hover:brightness-100"
              />
            </div>
          {/if}
          <div class="p-2">
            {@render details(i)}
          </div>
        </div>
      {/each}
    </div>
  {/if}
</div>

<style>
  .scrollbar-thin {
    scrollbar-width: thin;
    scrollbar-color: gray transparent;
  }
  .scrollbar-thin:hover {
    scrollbar-color: gray transparent;
  }

  .scrollbar-thin::-webkit-scrollbar {
    height: 4px;
  }
  .scrollbar-thin::-webkit-scrollbar-track {
    background: transparent;
  }
  .scrollbar-thin::-webkit-scrollbar-thumb {
    background: gray;
    border-radius: 4px;
  }
  .scrollbar-thin::-webkit-scrollbar-thumb:hover {
    background: gray;
  }
</style>
