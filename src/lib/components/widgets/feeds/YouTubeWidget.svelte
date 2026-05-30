<script lang="ts">
  import type { YouTubeVideo, BaseWidgetInfo } from '$lib/types/widget.data';
  import type { YouTubeParams } from '$lib/types/widget.params';
  import FeedRenderer from '$lib/components/ui/FeedRenderer.svelte';
  import { dateToNow } from '$lib/utils/time';

  interface Props {
    result: BaseWidgetInfo;
    class?: string;
  }

  let { result, class: className = '' }: Props = $props();

  let videos = $derived(
    (result.data as YouTubeVideo[]).map((v) => ({
      ...v,
      pubDate: new Date(v.pubDate),
    })),
  );
  let params = $derived(result.params as YouTubeParams);
  let showThumbnail = $derived(params.showThumbnail ?? false);
  let collapseAfter = $derived(params.collapseAfter ?? 5);
  let view = $derived(params.view ?? 'card');
  let dests = $derived(videos.map((v) => 'https://youtube.com/watch?v=' + v.videoId));
</script>

{#snippet renderDetails(index: number)}
  {#if videos[index]}
    <div class="flex flex-col">
      <a
        href={'https://youtube.com/watch?v=' + videos[index].videoId}
        target="_blank"
        rel="external noopener noreferrer"
        class="relative inline-block text-sm font-semibold text-primary"
      >
        <span class="line-clamp-2" title={videos[index].title}>
          {videos[index].title}
        </span>
      </a>
      <div class="flex gap-x-1 text-xs text-text">
        <span>{dateToNow(videos[index].pubDate)}</span>
        <span class="text-text-muted select-none">&bull;</span>
        <span>{videos[index].channelTitle}</span>
      </div>
    </div>
  {/if}
{/snippet}

<FeedRenderer
  {view}
  {showThumbnail}
  {collapseAfter}
  thumbnails={videos.map((v: YouTubeVideo) => v.thumbnail ?? '')}
  {dests}
  details={renderDetails}
  class={className}
/>
