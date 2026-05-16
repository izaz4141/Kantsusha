<script lang="ts">
  import type { ContainerData, EndpointData, BaseWidgetInfo } from '$lib/types/widget.data';
  import type { ServicesParams } from '$lib/types/widget.params';
  import { uiState } from '$lib/stores/global.svelte';
  import ContainerStatus from '$lib/components/ui/ContainerStatus.svelte';
  import EndpointStatus from '$lib/components/ui/EndpointStatus.svelte';

  interface Props {
    result: BaseWidgetInfo;
    class?: string;
  }

  let { result, class: className = '' }: Props = $props();

  let params = $derived(result.params as ServicesParams);
  let data = $derived(result.data as (ContainerData | EndpointData)[]);

  let column = $derived(uiState.isMobile ? 1 : params.column);

  function getContainerData(index: number): ContainerData | undefined {
    return data[index] as ContainerData | undefined;
  }

  function getEndpointData(index: number): EndpointData | undefined {
    return data[index] as EndpointData | undefined;
  }
</script>

<div class={className}>
  {#if params.services.length === 0}
    <div class="flex items-center justify-center py-4">
      <span class="text-text-muted">No services found</span>
    </div>
  {:else}
    <ul class="grid gap-2" style="grid-template-columns: repeat({column}, minmax(0, 1fr));">
      {#each params.services as service, i (i)}
        {@const isContainer = service.type === 'container'}
        <li
          class="flex h-12 items-center rounded-lg p-2 transition-all duration-200 ease-out hover:scale-[1.02] hover:bg-background/50 hover:shadow-md"
        >
          {#if isContainer}
            {@const containerData = getContainerData(i)}
            <ContainerStatus {service} {containerData} defaultTarget={params.target} />
          {:else}
            {@const endpointData = getEndpointData(i)}
            <EndpointStatus {service} {endpointData} defaultTarget={params.target} />
          {/if}
        </li>
      {/each}
    </ul>
  {/if}
</div>
