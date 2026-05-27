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
    if (status === 'online') return 'text-success';
    if (status === 'offline') return 'text-error';
    return 'text-text-muted';
  }
</script>

<div class="group flex h-full w-full gap-x-3">
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
        class="h-full w-full text-lg brightness-80 hover:brightness-100 {getStatusColor(status)}"
      >
        {#if status === 'online'}
          <!-- Pulsing dot with subtle glow effect -->
          <svg class="size-full" viewBox="0 0 24 24" fill="currentColor">
            <circle cx="12" cy="12" r="10" opacity="0.12" />
            <circle cx="12" cy="12" r="6" opacity="0.3" />
            <circle cx="12" cy="12" r="3" />
          </svg>
        {:else if status === 'offline'}
          <!-- Thin X with rounded caps -->
          <svg
            class="size-full"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.8"
            stroke-linecap="round"
          >
            <circle cx="12" cy="12" r="9" stroke-opacity="0.15" />
            <line x1="9" y1="9" x2="15" y2="15" />
            <line x1="15" y1="9" x2="9" y2="15" />
          </svg>
        {:else}
          <!-- Minimalist question mark for unknown -->
          <svg
            class="size-full"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.8"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <circle cx="12" cy="12" r="9" stroke-opacity="0.15" />
            <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
            <circle cx="12" cy="17" r="0.8" fill="currentColor" stroke="none" />
          </svg>
        {/if}
      </div>
      <Dropdown bind:open={dropdownOpen} trigger={triggerEl} targetPortal="portal-root">
        <div class="flex min-w-30 flex-col gap-1 p-2 text-xs">
          {#if endpointData}
            <div class="flex justify-between">
              <span class="text-text-muted">Status</span>
              <span class="text-text">{endpointData.status}</span>
            </div>
            {#if endpointData.responseTime && endpointData.status == 'online'}
              <div class="flex justify-between">
                <span class="text-text-muted">Response</span>
                <span
                  class={endpointData.responseTime < 500
                    ? 'text-success'
                    : endpointData.responseTime < 1000
                      ? 'text-warning'
                      : 'text-error'}>{endpointData.responseTime}ms</span
                >
              </div>
            {/if}
          {/if}
        </div>
      </Dropdown>
    </div>
  {/if}
</div>
