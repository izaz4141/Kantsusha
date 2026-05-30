<script lang="ts">
  import type { TwitchChannel, BaseWidgetInfo } from '$lib/types/widget.data';
  import type { TwitchChannelParams } from '$lib/types/widget.params';
  import Dropdown from '$lib/components/ui/Dropdown.svelte';
  import { dateToNow } from '$lib/utils/time';

  interface Props {
    result: BaseWidgetInfo;
    class?: string;
  }

  let { result, class: className = '' }: Props = $props();

  let channels = $derived(
    (result.data as TwitchChannel[]).map((c) => ({
      ...c,
      startedAt: c.startedAt ? new Date(c.startedAt) : undefined,
    })),
  );
  let _params = $derived(result.params as TwitchChannelParams);

  let hoveredIndex = $state<number | null>(null);
  let avatarRefs = $state<(HTMLDivElement | undefined)[]>([]);

  function formatViewerCount(count: number): string {
    if (count >= 1000) {
      return (count / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
    }
    return count.toString();
  }
</script>

<div class="flex flex-col gap-3 {className}">
  {#each channels as channel, i (channel.username)}
    <div class="group flex items-center justify-start gap-x-3">
      <div class="relative shrink-0">
        <div
          bind:this={avatarRefs[i]}
          class="relative h-12 w-12 shrink-0 overflow-hidden rounded-full border-3 transition-colors"
          class:border-border={!channel.isLive}
          class:border-primary={channel.isLive}
          onmouseenter={() => (hoveredIndex = i)}
          onmouseleave={() => (hoveredIndex = null)}
          role="status"
          aria-label={channel.isLive ? 'View stream details' : 'Channel offline'}
        >
          <a
            href={'https://twitch.tv/' + channel.username}
            target="_blank"
            rel="external noopener noreferrer"
            class="block h-full w-full"
          >
            {#if channel.avatarUrl}
              <img
                src={channel.avatarUrl}
                alt={channel.nickname}
                class="h-full w-full rounded-full object-cover p-0.5 brightness-80 group-hover:brightness-100"
              />
            {:else}
              <div
                class="flex h-full w-full items-center justify-center rounded-full bg-surface p-0.5 text-text-muted"
              >
                ?
              </div>
            {/if}
          </a>
        </div>

        {#if channel.isLive}
          <div
            class="absolute -bottom-1 left-1/2 -translate-x-1/2 rounded bg-primary px-1.5 py-0.5 text-[10px] font-bold text-text-on-primary uppercase"
          >
            Live
          </div>
        {/if}

        {#if hoveredIndex === i && channel.isLive && channel.thumbnailUrl && avatarRefs[i]}
          <Dropdown open={hoveredIndex === i} trigger={avatarRefs[i]!} class="mt-2">
            <div class="w-80">
              <img
                src={channel.thumbnailUrl}
                alt={channel.streamTitle}
                class="w-full rounded bg-background object-cover"
              />
              {#if channel.streamTitle}
                <p class="mt-2 line-clamp-2 text-sm text-text">{channel.streamTitle}</p>
              {/if}
            </div>
          </Dropdown>
        {/if}
      </div>

      <div class="flex min-w-0 flex-1 flex-col gap-0.5">
        <a
          href={'https://twitch.tv/' + channel.username}
          target="_blank"
          rel="external noopener noreferrer"
          class="block truncate text-sm font-semibold {channel.isLive
            ? 'text-text'
            : 'text-text-muted'}"
          title={channel.nickname}
        >
          {channel.nickname}
        </a>
        {#if channel.isLive}
          {#if channel.category}
            <a
              href={'https://twitch.tv/directory/category/' + channel.categorySlug}
              target="_blank"
              rel="external noopener noreferrer"
              class="truncate text-xs text-text-muted"
              title={channel.category}
            >
              {channel.category}
            </a>
          {/if}

          <div class="flex items-center gap-x-2 text-xs text-text-muted">
            {#if channel.startedAt}
              <span>{dateToNow(channel.startedAt)}</span>
            {/if}
            <span class="select-none">&bull;</span>
            <span>{formatViewerCount(channel.viewerCount)} viewers</span>
          </div>
        {:else}
          <span class="rounded bg-surface text-xs text-text-muted uppercase"> Offline </span>
        {/if}
      </div>
    </div>
  {/each}
</div>
