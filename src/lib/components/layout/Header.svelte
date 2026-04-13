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

<header
  class="mb-4 hidden items-center justify-between border border-border px-6 py-3 md:flex {uiState.layoutType ===
  'slim'
    ? 'md:w-4/5'
    : 'w-full'}"
>
  <div class="flex items-center gap-6">
    <a href={resolve(`/${routes[0].slug}`)} class="flex items-center">
      <img src={favicon} alt="Logo" class="h-7 w-7" />
    </a>
    <nav class="flex gap-4">
      {#each routes as route (route.slug)}
        <a
          href={resolve(`/${route.slug}`)}
          class="h-full text-sm text-text no-underline
          transition-opacity hover:opacity-70
          {page.url.pathname.startsWith('/' + route.slug) ? 'border-b border-primary' : ''}"
          >{route.name}</a
        >
      {/each}
    </nav>
  </div>
  <div class="flex items-center">
    <SettingsIcon />
  </div>
</header>
