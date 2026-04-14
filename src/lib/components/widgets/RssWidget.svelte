<script lang="ts">
  import type { RssArticle, BaseWidgetInfo } from '$lib/types/widget.data';
  import type { RssParams } from '$lib/types/widget.params';
  import ListView from '../ui/ListView.svelte';
  import { dateToNow } from '$lib/utils/time';

  interface Props {
    result: BaseWidgetInfo;
    class?: string;
  }

  let { result, class: className = '' }: Props = $props();

  let articles = $derived(
    (result.data as RssArticle[]).map((a) => ({
      ...a,
      pubDate: new Date(a.pubDate),
    })),
  );
  let params = $derived(result.params as RssParams);
  let showThumbnail = $derived(params.showThumbnail ?? false);
  let collapseAfter = $derived(params.collapseAfter ?? 5);
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
  thumbnails={articles.map((a: RssArticle) => a.thumbnail ?? '')}
  details={renderDetails}
  class={className}
/>
