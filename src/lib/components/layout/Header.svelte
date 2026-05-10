<script lang="ts">
  import favicon from '$lib/assets/favicon.svg';
  import { page } from '$app/state';
  import { resolve } from '$app/paths';
  import { uiState } from '$lib/stores/global.svelte';
  import SettingsIcon from '$lib/components/shared/SettingsIcon.svelte';

  interface Props {
    routes: { name: string; slug: string }[];
  }
  let { routes }: Props = $props();
</script>

{#if !uiState.isMobile}
  <header
    class="mb-4 flex h-12 items-center justify-between border border-border px-6
  {uiState.layoutType === 'slim' ? 'md:w-4/5' : 'w-full'}"
  >
    <div class="flex h-full items-center gap-6">
      <a href={resolve(`/${routes[0].slug}`)} class="flex items-center">
        <img src={favicon} alt="Logo" class="h-7 w-7" />
      </a>
      <nav class="flex h-full gap-4">
        {#each routes as route (route.slug)}
          <div class="relative flex h-full items-center">
            <a
              href={resolve(`/${route.slug}`)}
              class="peer flex text-sm text-text no-underline
            transition-opacity hover:opacity-70">{route.name}</a
            >
            <div
              class="absolute bottom-0 left-1/2 h-0.5 w-8/10 -translate-x-1/2 {page.url.pathname.startsWith(
                '/' + route.slug,
              )
                ? 'bg-primary'
                : 'peer-hover:bg-text-muted'}"
            ></div>
          </div>
        {/each}
      </nav>
    </div>
    <div class="flex items-center">
      <SettingsIcon />
    </div>
  </header>
{/if}
