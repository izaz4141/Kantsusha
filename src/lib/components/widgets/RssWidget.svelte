<script lang="ts">
  import type { RssArticle, WidgetData } from '$lib/types/widget.data';
  import ListView from '../ui/ListView.svelte';
  import { dateToNow } from '$lib/utils/time';

  interface Props {
    result: WidgetData;
    class?: string;
  }

  let { result, class: className = '' }: Props = $props();

  let articles = $derived(
    (result.data as RssArticle[]).map((a) => ({
      ...a,
      pubDate: new Date(a.pubDate),
    })),
  );
  let showThumbnail = $derived(result.params.showThumbnail ?? false);
  let collapseAfter = $derived(result.params.collapseAfter ?? 5);
</script>

{#snippet renderDetails(index: number)}
  {#if articles[index]}
    <a
      href={articles[index].link}
      target="_blank"
      rel="external noopener noreferrer"
      class="relative inline-block text-sm font-semibold text-primary"
    >
      <span class="line-clamp-2 text-justify">
        {articles[index].title}
      </span>
    </a>
    <div class="flex gap-x-1 text-xs text-text">
      <span>{dateToNow(articles[index].pubDate)}</span>
      <span class="text-text-muted select-none">&bull;</span>
      <span>{articles[index].source}</span>
    </div>
  {/if}
{/snippet}

<ListView
  {showThumbnail}
  {collapseAfter}
  thumbnails={articles.map((a) => a.thumbnail ?? '')}
  details={renderDetails}
  class={className}
/>
