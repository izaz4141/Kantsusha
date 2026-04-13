<script lang="ts">
  import Default from '$lib/components/layout/Default.svelte';
  import WidgetRenderer from '$lib/components/ui/WidgetRenderer.svelte';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();

  let activeTab = $state(0);
</script>

{#snippet list()}
  <WidgetRenderer id={data.calendarId} type="calendar" />
  <WidgetRenderer id={data.rssId} type="rss" />
{/snippet}

{#snippet detail()}
  <WidgetRenderer id={data.redditId} type="reddit" />
{/snippet}

{#snippet settings()}
  <div class="flex h-full items-center justify-center bg-surface-raised p-4">
    <div class="text-center">
      <h2 class="text-lg font-bold text-text">Panel 3 - Settings</h2>
      <p class="text-sm text-text-muted">Settings content goes here</p>
    </div>
  </div>
{/snippet}

<Default
  bind:currentPanel={activeTab}
  panels={[
    { size: 'small', content: list },
    { size: 'full', content: detail },
    { size: 'small', content: settings },
  ]}
/>
