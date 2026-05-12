<script lang="ts">
  import './layout.css';
  import Header from '$lib/components/layout/Header.svelte';
  import Footer from '$lib/components/layout/Footer.svelte';
  import MobileHeader from '$lib/components/layout/MobileHeader.svelte';
  import { setThemeCookie, themeState } from '$lib/theme/store.svelte';
  import type { Snippet } from 'svelte';
  import type { ThemePreset } from '$lib/theme/types';

  interface Props {
    data: {
      theme: { name: string; css: string; presets: Record<string, ThemePreset> };
      routes: { name: string; slug: string }[];
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
</script>

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
