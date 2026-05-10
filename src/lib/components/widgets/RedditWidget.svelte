<script lang="ts">
  import type { RedditPost, BaseWidgetInfo } from '$lib/types/widget.data';
  import type { RedditParams } from '$lib/types/widget.params';
  import ListView from '../ui/ListView.svelte';
  import { dateToNow } from '$lib/utils/time';

  interface Props {
    result: BaseWidgetInfo;
    class?: string;
  }

  let { result, class: className = '' }: Props = $props();

  let posts = $derived(
    (result.data as RedditPost[]).map((p) => ({
      ...p,
      pubDate: new Date(p.pubDate),
    })),
  );
  let params = $derived(result.params as RedditParams);
  let showThumbnail = $derived(params.showThumbnail ?? false);
  let collapseAfter = $derived(params.collapseAfter ?? 5);

  function formatScore(score: number): string {
    if (score >= 1000000) return `${(score / 1000000).toFixed(1)}m`;
    if (score >= 1000) return `${(score / 1000).toFixed(1)}k`;
    return score.toString();
  }
</script>

{#snippet renderDetails(index: number)}
  {#if posts[index]}
    <a
      href={posts[index].permalink}
      target="_blank"
      rel="external noopener noreferrer"
      class="relative inline-block text-sm font-semibold text-primary"
    >
      <span class="line-clamp-2 text-justify">
        {posts[index].title}
      </span>
    </a>
    <div class="flex gap-x-2 text-xs text-text-muted">
      <span class="text-success">↑ {formatScore(posts[index].score)}</span>
      <span class="text-text">󰻞 {posts[index].numComments}</span>
      <span> {dateToNow(posts[index].pubDate)}</span>
      <span>by {posts[index].author}</span>
    </div>
  {/if}
{/snippet}

<ListView
  {showThumbnail}
  {collapseAfter}
  thumbnails={posts.map((p) => p.thumbnail ?? '')}
  details={renderDetails}
  class={className}
/>
