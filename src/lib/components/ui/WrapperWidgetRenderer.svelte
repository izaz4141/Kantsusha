<script lang="ts">
  import Tabbed from '$lib/components/ui/Tabbed.svelte';
  import SplitColumn from '$lib/components/ui/SplitColumn.svelte';
  import SplitRow from '$lib/components/ui/SplitRow.svelte';
  import type { WrapperWidgetParams } from '$lib/types/widget.params';

  interface Props {
    id: string;
    type: WrapperWidgetParams['type'];
  }
  let { id, type }: Props = $props();
</script>

{#if type == 'tabbed'}
  <Tabbed {id} />
{:else if type == 'split-column'}
  <SplitColumn {id} />
{:else if type == 'split-row'}
  <SplitRow {id} />
{/if}
