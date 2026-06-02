<script lang="ts">
  import type { BaseWidgetInfo, ServerStatsData } from '$lib/types/widget.data';
  import type { ServerStatsParams } from '$lib/types/widget.params';
  import ServerStatsCard from '$lib/components/widgets/ServerStatsCard.svelte';

  interface Props {
    result: BaseWidgetInfo;
    class?: string;
  }

  let { result, class: className = '' }: Props = $props();

  let allStats = $derived(result.data as ServerStatsData[]);
  let params = $derived(result.params as ServerStatsParams);
</script>

<div class="{className} flex flex-col gap-4">
  {#each allStats as data (data.hostname)}
    <ServerStatsCard {data} {params} />
  {/each}
</div>
