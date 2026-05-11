<script lang="ts">
  import type { EndpointData } from '$lib/types/widget.data';
  import type { EndpointParams } from '$lib/types/widget.params';
  import RenderIcon from '$lib/components/shared/RenderIcon.svelte';
  import Dropdown from '$lib/components/ui/Dropdown.svelte';
  import { resolveString } from '$lib/utils/substitution';

  interface Props {
    service: EndpointParams;
    endpointData: EndpointData | undefined;
    defaultTarget: string | undefined;
  }

  let { service, endpointData, defaultTarget }: Props = $props();

  let dropdownOpen = $state(false);
  let triggerEl = $state<HTMLElement>();

  function handleMouseEnter() {
    dropdownOpen = true;
  }

  function handleMouseLeave() {
    dropdownOpen = false;
  }

  function getStatusColor(status: EndpointData['status']): string {
    if (status === 'online') return 'text-green-500';
    if (status === 'offline') return 'text-red-500';
    return 'text-gray-500';
  }
</script>

<div class="group flex h-full w-full gap-x-4">
  <div class="flex h-full w-8 items-center justify-center brightness-80 group-hover:brightness-100">
    <RenderIcon icon={service.icon} name={service.name} />
  </div>
  <div class="flex w-[calc(90%-2rem)] flex-col justify-center overflow-hidden">
    {#if service.url}
      <a
        href={resolveString(service.url)}
        target={service.target ?? defaultTarget}
        rel="external noopener noreferrer"
        class="truncate text-sm font-semibold text-primary"
      >
        {service.name}
      </a>
    {:else}
      <span class="truncate text-sm font-semibold text-text">
        {service.name}
      </span>
    {/if}
    {#if service.description}
      <span class="truncate text-xs text-text-muted">
        {service.description}
      </span>
    {/if}
  </div>
  {#if service.statusCheck}
    {@const status = endpointData?.status ?? 'unknown'}
    <div class="relative flex w-1/10 items-center justify-center">
      <div
        bind:this={triggerEl}
        onmouseenter={handleMouseEnter}
        onmouseleave={handleMouseLeave}
        role="status"
        aria-label="Endpoint status"
        class="h-6 w-6 p-1 text-lg brightness-80 hover:brightness-100 {getStatusColor(status)}"
      >
        {#if status === 'online'}
          <svg class="size-full" viewBox="0 0 24 24" fill="currentColor"
            ><circle cx="12" cy="12" r="10" opacity="0.3" /><circle cx="12" cy="12" r="5" /></svg
          >
        {:else if status === 'offline'}
          <svg
            class="size-full"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2.5"
            ><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg
          >
        {:else}
          <svg
            class="size-full"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"><circle cx="12" cy="12" r="9" /></svg
          >
        {/if}
      </div>
      <Dropdown bind:open={dropdownOpen} trigger={triggerEl}>
        <div class="flex min-w-30 flex-col gap-1 p-2 text-xs">
          {#if endpointData}
            <div class="flex justify-between">
              <span class="text-text-muted">Status</span>
              <span class="text-text">{endpointData.status}</span>
            </div>
          {/if}
        </div>
      </Dropdown>
    </div>
  {/if}
</div>
