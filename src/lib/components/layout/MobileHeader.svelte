<script lang="ts">
  import { tick } from 'svelte';
  import { page } from '$app/state';
  import { resolve } from '$app/paths';
  import { uiState } from '$lib/stores/global.svelte';
  import SettingsIcon from '$lib/components/shared/SettingsIcon.svelte';

  interface Props {
    routes: { name: string; slug: string }[];
  }
  let { routes }: Props = $props();

  let menuOpen = $state(false);

  function closeMenu() {
    menuOpen = false;
  }

  function scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  let currentPanel = $state(0);
  let menuEl = $state<HTMLDivElement>();
  let headerTranslate = $state(0);
  let numPanel = $derived(uiState.numPanel);

  $effect(() => {
    if (!menuOpen) {
      headerTranslate = 0;
      return;
    }
    (async () => {
      await tick();
      const menuHeight = menuEl?.clientHeight || 0;
      headerTranslate = menuHeight;
    })();
  });
</script>

{#if uiState.isMobile}
  <div
    class="fixed right-0 bottom-0 left-0 z-50 transition-transform duration-300"
    style="translate: 0 -{headerTranslate}px;"
  >
    <header class="flex justify-center border-t border-border bg-surface p-2">
      <nav
        class="grid w-full max-w-md items-center justify-items-center"
        style="grid-template-columns: repeat({numPanel + 2}, minmax(0, 1fr));"
      >
        <button
          type="button"
          class="rounded-lg p-2 text-text-muted transition-colors hover:text-text"
          onclick={scrollToTop}
          aria-label="Scroll to top"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="m18 15-6-6-6 6" />
          </svg>
        </button>
        {#if numPanel > 0}
          {#each { length: numPanel } as _, i (i)}
            <button
              type="button"
              aria-label="Go to panel {i}"
              class="rounded-lg px-2 py-2 transition-all duration-300"
              onclick={() => {
                currentPanel = i;
                window.dispatchEvent(new CustomEvent('navigate-panel', { detail: i }));
              }}
            >
              <div
                class="h-2.5 rounded-full transition-all duration-300
              {currentPanel === i ? 'w-9 bg-primary' : 'w-2.5 bg-gray-400'}"
              ></div>
            </button>
          {/each}
        {/if}

        <button
          type="button"
          class="rounded-lg p-2 text-text-muted transition-colors hover:text-text"
          onclick={() => (menuOpen = !menuOpen)}
          aria-label="Open menu"
          aria-expanded={menuOpen}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            class="transition-colors duration-300 {menuOpen ? 'text-primary' : ''}"
          >
            <line
              x1="4"
              x2="20"
              y1="6"
              y2="6"
              class="transition-transform duration-300 {menuOpen ? '-translate-y-0.5' : ''}"
            />

            <line x1="4" x2="20" y1="12" y2="12" />

            <line
              x1="4"
              x2="20"
              y1="18"
              y2="18"
              class="transition-transform duration-300 {menuOpen ? 'translate-y-0.5' : ''}"
            />
          </svg>
        </button>
      </nav>
    </header>
    <div
      bind:this={menuEl}
      class="absolute top-full right-0 left-0 border-t border-border bg-surface p-2"
    >
      <div class="flex items-center justify-between">
        <nav class="flex flex-row gap-4">
          {#each routes as route (route.slug)}
            <a
              href={resolve(`/${route.slug}`)}
              class="text-no-underline
            text-sm font-medium text-text transition-colors hover:text-text-muted
            {page.url.pathname.startsWith(`/${route.slug}`) ? 'border-b border-primary' : ''}"
              onclick={closeMenu}
            >
              {route.name}
            </a>
          {/each}
        </nav>
        <SettingsIcon />
      </div>
    </div>
  </div>
{/if}
