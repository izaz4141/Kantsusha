<script lang="ts">
  import type { ContainerData } from '$lib/types/widget.data';
  import type { ContainerParams } from '$lib/types/widget.params';
  import RenderIcon from '$lib/components/shared/RenderIcon.svelte';
  import Dropdown from '$lib/components/ui/Dropdown.svelte';
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
      if (health === 'healthy') return 'text-green-500';
      if (health === 'unhealthy') return 'text-red-500';
      if (health === 'starting') return 'text-yellow-500';
      return 'text-green-500';
    }
    if (status === 'paused') return 'text-yellow-500';
    if (status === 'exited') return 'text-gray-500';
    if (status === 'restarting') return 'text-yellow-500';
    if (status === 'removing') return 'text-orange-500';
    if (status === 'dead') return 'text-red-500';
    return 'text-gray-500';
  }
</script>

<div class="group flex h-full w-full gap-x-4">
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
      <Dropdown bind:open={iconDropdownOpen} trigger={iconTriggerEl}>
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
        class="h-6 w-6 p-1 text-lg brightness-80 hover:brightness-100 {getStatusColor(
          containerData.status,
          containerData.health,
        )}"
      >
        {#if containerData.status === 'running' && containerData.health === 'healthy'}
          <svg class="size-full" viewBox="0 0 24 24" fill="currentColor"
            ><circle cx="12" cy="12" r="10" opacity="0.3" /><circle cx="12" cy="12" r="5" /></svg
          >
        {:else if containerData.status === 'running' && containerData.health === 'unhealthy'}
          <svg
            class="size-full"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2.5"
            ><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg
          >
        {:else if containerData.status === 'running' && containerData.health === 'starting'}
          <svg
            class="size-full animate-spin"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg
          >
        {:else if containerData.status === 'running'}
          <svg class="size-full" viewBox="0 0 24 24" fill="currentColor"
            ><circle cx="12" cy="12" r="10" opacity="0.3" /><circle cx="12" cy="12" r="5" /></svg
          >
        {:else if containerData.status === 'paused'}
          <svg class="size-full" viewBox="0 0 24 24" fill="currentColor"
            ><rect x="6" y="4" width="4" height="16" /><rect
              x="14"
              y="4"
              width="4"
              height="16"
            /></svg
          >
        {:else if containerData.status === 'exited'}
          <svg
            class="size-full"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"><circle cx="12" cy="12" r="9" /></svg
          >
        {:else if containerData.status === 'restarting'}
          <svg
            class="size-full"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            ><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /><path
              d="M3 3v5h5"
            /><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" /><path
              d="M16 21h5v-5"
            /></svg
          >
        {:else if containerData.status === 'removing'}
          <svg
            class="size-full"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            ><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path
              d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"
            /></svg
          >
        {:else if containerData.status === 'dead'}
          <svg
            class="size-full"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
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
      <Dropdown bind:open={statusDropdownOpen} trigger={statusTriggerEl}>
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
