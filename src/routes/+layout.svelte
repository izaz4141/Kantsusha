<script lang="ts">
  import './layout.css';
  import Header from '$lib/components/layout/Header.svelte';
  import Footer from '$lib/components/layout/Footer.svelte';
  import MobileHeader from '$lib/components/layout/MobileHeader.svelte';
  import SearchModal from '$lib/components/shared/SearchModal.svelte';
  import { setThemeCookie, themeState } from '$lib/theme/store.svelte';
  import { searchState, openSearch, closeSearch } from '$lib/stores/search.svelte';
  import type { Snippet } from 'svelte';
  import type { ThemePreset } from '$lib/types/theme';
  import type { SearchConfig } from '$lib/types/search';

  interface Props {
    data: {
      theme: { name: string; css: string; presets: Record<string, ThemePreset> };
      routes: { name: string; slug: string }[];
      search: SearchConfig;
    };
    children: Snippet;
  }
  let { data, children }: Props = $props();

  // svelte-ignore state_referenced_locally
  themeState.current = data.theme.name;
  // svelte-ignore state_referenced_locally
  themeState.presets = data.theme.presets;

  $effect(() => {
    const colorScheme: string = themeState.presets[themeState.current].colorScheme;
    document.documentElement.setAttribute('data-color-scheme', colorScheme);
    document.documentElement.setAttribute('data-theme', themeState.current);
    setThemeCookie(themeState.current);
  });

  $effect(() => {
    const search = data.search;
    if (search.enabled) {
      searchState.enabled = true;
      searchState.triggerKey = search.triggerKey;
      searchState.target = search.target;
      searchState.engines = search.engines;
      searchState.selectedEngine = search.default || Object.keys(search.engines)[0];
    }
  });

  function onKeydown(e: KeyboardEvent) {
    if (!searchState.enabled) return;
    const isTriggerKey = e.key === searchState.triggerKey && !e.ctrlKey && !e.metaKey;
    const isCtrlK = (e.ctrlKey || e.metaKey) && e.key === 'k';
    if (isTriggerKey || isCtrlK) {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag !== 'INPUT' && tag !== 'TEXTAREA' && !(e.target as HTMLElement)?.isContentEditable) {
        e.preventDefault();
        openSearch();
      }
    }
    if (e.key === 'Escape' && searchState.open) {
      closeSearch();
    }
  }
</script>

<svelte:window onkeydown={onKeydown} />
<SearchModal />

<svelte:head>
  <!-- eslint-disable-next-line svelte/no-at-html-tags -->
  {@html `<style>${data.theme.css}</style>`}
</svelte:head>

<div class="flex min-h-screen flex-col items-center px-4 pt-4">
  <Header routes={data.routes} />
  <main class="w-full grow pb-16 md:pb-0">{@render children()}</main>
  <MobileHeader routes={data.routes} />

  <Footer />
</div>
<div id="portal-root" class="pointer-events-none fixed inset-0 z-9999"></div>
