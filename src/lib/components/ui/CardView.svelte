<script lang="ts">
  import { slide } from 'svelte/transition';
  import type { Snippet } from 'svelte';
  import brokenIcon from '$lib/assets/broken-icon.svg';

  interface Props {
    thumbnails: string[];
    details: Snippet<[index: number]>;
    dests?: string[];
    class?: string;
  }

  let { thumbnails, details, dests = [], class: className = '' }: Props = $props();

  let scrollContainer: HTMLDivElement | undefined = $state();
  let isAtLeft = $state(true);
  let isAtRight = $state(true);

  function checkScroll() {
    if (!scrollContainer) return;
    const el = scrollContainer;
    isAtLeft = el.scrollLeft <= 2;
    isAtRight = el.scrollLeft >= el.scrollWidth - el.clientWidth - 2;
  }

  $effect(() => {
    if (!scrollContainer) return;
    const el = scrollContainer;
    checkScroll();
    el.addEventListener('scroll', checkScroll, { passive: true });
    const observer = new ResizeObserver(checkScroll);
    observer.observe(el);
    return () => {
      el.removeEventListener('scroll', checkScroll);
      observer.disconnect();
    };
  });
</script>

<div class={className}>
  {#if thumbnails.length === 0}
    <div class="flex items-center justify-center py-4" transition:slide={{ duration: 300 }}>
      <span class="text-text-muted">No items found</span>
    </div>
  {:else}
    <div class="scroll-fade-wrapper" class:at-left={isAtLeft} class:at-right={isAtRight}>
      <div
        bind:this={scrollContainer}
        class="scrollbar-thin -mb-2 flex gap-3 overflow-x-scroll pb-2"
        transition:slide={{ duration: 300 }}
      >
        {#each thumbnails as _, i (`card_${i}`)}
          <div
            class="group transition-slide flex max-w-36 shrink-0 flex-col overflow-hidden rounded border border-border bg-surface md:max-w-44"
            transition:slide={{ duration: 300 }}
          >
            <div class="aspect-video w-full overflow-hidden">
              {#if dests[i]}
                <a
                  href={dests[i]}
                  target="_blank"
                  rel="external noopener noreferrer"
                  class="block h-full w-full"
                >
                  <img
                    src={thumbnails[i]}
                    alt=""
                    class="h-full w-full object-cover brightness-80 transition-all group-hover:brightness-100"
                    onerror={(e) => ((e.currentTarget as HTMLImageElement).src = brokenIcon)}
                  />
                </a>
              {:else}
                <img
                  src={thumbnails[i]}
                  alt=""
                  class="h-full w-full object-cover brightness-80 transition-all group-hover:brightness-100"
                  onerror={(e) => ((e.currentTarget as HTMLImageElement).src = brokenIcon)}
                />
              {/if}
            </div>
            <div class="p-2">
              {@render details(i)}
            </div>
          </div>
        {/each}
      </div>
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

  .scroll-fade-wrapper {
    position: relative;
  }

  .scroll-fade-wrapper::before,
  .scroll-fade-wrapper::after {
    content: '';
    position: absolute;
    top: 0;
    bottom: 8px;
    width: 48px;
    pointer-events: none;
    z-index: 1;
  }

  .scroll-fade-wrapper::before {
    left: 0;
    background: linear-gradient(to right, var(--color-background), transparent);
  }

  .scroll-fade-wrapper::after {
    right: 0;
    background: linear-gradient(to left, var(--color-background), transparent);
  }

  .scroll-fade-wrapper.at-left::before {
    opacity: 0;
  }

  .scroll-fade-wrapper.at-right::after {
    opacity: 0;
  }
</style>
