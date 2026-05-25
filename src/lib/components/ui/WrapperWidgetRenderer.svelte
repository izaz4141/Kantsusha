<script lang="ts">
  import Tabbed from '$lib/components/ui/Tabbed.svelte';
  import SplitColumn from '$lib/components/ui/SplitColumn.svelte';
  import SplitRow from '$lib/components/ui/SplitRow.svelte';
  import type { WrapperWidgetParams } from '$lib/types/widget.params';

  interface Props {
    id: string;
    type: WrapperWidgetParams['type'];
    refreshSignal?: number;
  }
  let { id, type, refreshSignal = 0 }: Props = $props();
</script>

{#if type == 'tabbed'}
  <Tabbed {id} {refreshSignal} />
{:else if type == 'split-column'}
  <SplitColumn {id} {refreshSignal} />
{:else if type == 'split-row'}
  <SplitRow {id} {refreshSignal} />
{/if}
