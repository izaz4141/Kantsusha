<script lang="ts">
  import type { ContainerData } from '$lib/types/widget.data';
  import type { ContainerParams } from '$lib/types/widget.params';
  import RenderIcon from '$lib/components/shared/RenderIcon.svelte';
  import Dropdown from '$lib/components/ui/Dropdown.svelte';
  import { dateToNow } from '$lib/utils/time';
  import { resolveString } from '$lib/utils/substitution';

  interface Props {
    service: ContainerParams;
    containerData: ContainerData | undefined;
    defaultTarget: string | undefined;
  }

  let { service, containerData, defaultTarget }: Props = $props();

  let iconDropdownOpen = $state(false);
  let iconTriggerEl = $state<HTMLElement>();

  function handleIconMouseEnter() {
    iconDropdownOpen = true;
  }

  function handleIconMouseLeave() {
    iconDropdownOpen = false;
  }

  let statusDropdownOpen = $state(false);
  let statusTriggerEl = $state<HTMLElement>();

  function handleStatusMouseEnter() {
    statusDropdownOpen = true;
  }

  function handleStatusMouseLeave() {
    statusDropdownOpen = false;
  }

  function formatMemory(bytes: number): string {
    const mb = bytes / (1024 * 1024);
    if (mb >= 1024) {
      return `${(mb / 1024).toFixed(1)} GB`;
    }
    return `${Math.round(mb)} MB`;
  }

  function getStatusColor(
    status: ContainerData['status'],
    health: ContainerData['health'],
  ): string {
    if (status === 'running') {
      if (health === 'healthy') return 'text-success';
      if (health === 'unhealthy') return 'text-error';
      if (health === 'starting') return 'text-warning';
      return 'text-success';
    }
    if (status === 'paused') return 'text-warning';
    if (status === 'exited') return 'text-text-muted';
    if (status === 'restarting') return 'text-warning';
    if (status === 'removing') return 'text-warning';
    if (status === 'dead') return 'text-error';
    if (status === 'unknown') return 'text-error';
    return 'text-text-muted';
  }
</script>

<div class="group flex h-full w-full gap-x-3">
  <div class="relative flex h-full w-8 items-center justify-center">
    <div
      bind:this={iconTriggerEl}
      onmouseenter={handleIconMouseEnter}
      onmouseleave={handleIconMouseLeave}
      role="status"
      aria-label={service.name}
      class="h-full w-8 brightness-80 group-hover:brightness-100"
    >
      <RenderIcon icon={service.icon} name={service.name} />
    </div>
    {#if containerData}
      <Dropdown bind:open={iconDropdownOpen} trigger={iconTriggerEl} targetPortal="portal-root">
        <div class="flex min-w-45 flex-col gap-1 p-2 text-xs">
          <div class="flex flex-col gap-0.5">
            <span class="text-text-muted">Image</span>
            <span class="truncate text-text">{containerData.image}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-text-muted">CPU</span>
            <span class="text-text">{containerData.cpuPercent.toFixed(1)}%</span>
          </div>
          <div class="flex justify-between">
            <span class="text-text-muted">RAM</span>
            <span class="text-text"
              >{formatMemory(containerData.memoryUsage)} / {formatMemory(
                containerData.memoryLimit,
              )}</span
            >
          </div>
          {#if containerData.time !== null}
            <div class="flex justify-between">
              <span class="text-text-muted">{containerData.time >= 0 ? 'Uptime' : 'Downtime'}</span>
              <span class="text-text"
                >{dateToNow(
                  new Date(
                    Date.now() -
                      (containerData.time >= 0 ? containerData.time : -containerData.time),
                  ),
                )}</span
              >
            </div>
          {/if}
        </div>
      </Dropdown>
    {/if}
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
  <div class="relative flex w-1/10 items-center justify-center">
    {#if containerData}
      <div
        bind:this={statusTriggerEl}
        onmouseenter={handleStatusMouseEnter}
        onmouseleave={handleStatusMouseLeave}
        role="status"
        aria-label="Container status"
        class="h-full w-full text-lg brightness-80 hover:brightness-100 {getStatusColor(
          containerData.status,
          containerData.health,
        )}"
      >
        {#if containerData.status === 'running' && containerData.health === 'healthy'}
          <!-- Elegant solid check with subtle ring -->
          <svg class="size-full" viewBox="0 0 24 24" fill="currentColor">
            <circle cx="12" cy="12" r="9" opacity="0.15" />
            <path
              d="M12 3a9 9 0 1 0 9 9A9 9 0 0 0 12 3zm-1.5 14.5L7 13l1.5-1.5L10.5 13l5-5L17 9.5z"
            />
          </svg>
        {:else if containerData.status === 'running' && containerData.health === 'unhealthy'}
          <!-- Warning triangle with exclamation -->
          <svg
            class="size-full"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.8"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M12 3L3 21h18L12 3z" />
            <circle cx="12" cy="16" r="0.8" fill="currentColor" stroke="none" />
            <line x1="12" y1="9" x2="12" y2="13" />
          </svg>
        {:else if containerData.status === 'running' && containerData.health === 'starting'}
          <!-- Thin spinner -->
          <svg
            class="size-full animate-spin"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.8"
            stroke-linecap="round"
          >
            <path d="M12 3a9 9 0 0 1 9 9" />
            <circle cx="12" cy="12" r="9" stroke-dasharray="40 10" stroke-opacity="0.2" />
          </svg>
        {:else if containerData.status === 'running'}
          <!-- Minimalist pulsing dot -->
          <svg class="size-full" fill="currentColor" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="9" opacity="0.12" />
            <circle cx="12" cy="12" r="4" />
          </svg>
        {:else if containerData.status === 'paused'}
          <!-- Two thin rounded pause bars -->
          <svg class="size-full" viewBox="0 0 24 24" fill="currentColor">
            <rect x="6.5" y="3" width="3.5" height="18" rx="1.5" />
            <rect x="14" y="3" width="3.5" height="18" rx="1.5" />
          </svg>
        {:else if containerData.status === 'exited'}
          <!-- Subtle squared outline -->
          <svg
            class="size-full"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.8"
            stroke-linecap="round"
          >
            <rect x="4" y="4" width="16" height="16" rx="2" />
          </svg>
        {:else if containerData.status === 'restarting'}
          <!-- Elegant circular arrow with minimal stroke -->
          <svg
            class="size-full"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.8"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M21 12a9 9 0 0 0-9-9 8.5 8.5 0 0 0-6.5 3" />
            <path d="M3 5v4h4" />
            <path d="M3 12a9 9 0 0 0 9 9 8.5 8.5 0 0 0 6.5-3" />
            <path d="M21 19v-4h-4" />
          </svg>
        {:else if containerData.status === 'removing'}
          <!-- Trash icon -->
          <svg
            class="size-full"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.8"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M3 7h18" />
            <path d="M9 11v5" />
            <path d="M15 11v5" />
            <path d="M5 7v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7" />
            <path d="M8 5V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v1" />
          </svg>
        {:else if containerData.status === 'dead'}
          <!-- Dashed circle with X -->
          <svg
            class="size-full"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.8"
            stroke-linecap="round"
          >
            <circle cx="12" cy="12" r="9" stroke-dasharray="3 3" />
            <line x1="8.5" y1="8.5" x2="15.5" y2="15.5" stroke-dasharray="none" />
            <line x1="15.5" y1="8.5" x2="8.5" y2="15.5" stroke-dasharray="none" />
          </svg>
        {:else}
          <!-- Question mark -->
          <svg
            class="size-full"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.8"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <circle cx="12" cy="12" r="9" stroke-opacity="0.2" />
            <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
            <circle cx="12" cy="17" r="0.8" fill="currentColor" stroke="none" />
          </svg>
        {/if}
      </div>
      <Dropdown bind:open={statusDropdownOpen} trigger={statusTriggerEl} targetPortal="portal-root">
        <div class="flex min-w-30 flex-col gap-1 p-2 text-xs">
          {#if containerData}
            <div class="flex justify-between">
              <span class="text-text-muted">{containerData.health ? 'Health' : 'Status'}</span>
              <span class="text-text">{containerData.health ?? containerData.status}</span>
            </div>
          {/if}
        </div>
      </Dropdown>
    {/if}
  </div>
</div>
