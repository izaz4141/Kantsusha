<script lang="ts">
  import type { ServerStatsData } from '$lib/types/widget.data';
  import type { ServerStatsParams } from '$lib/types/widget.params';
  import Dropdown from '$lib/components/ui/Dropdown.svelte';
  import { PLATFORM_SLUGS } from '$lib/utils/constants';
  import brokenIcon from '$lib/assets/broken-icon.svg';

  interface Props {
    data: ServerStatsData;
    params: ServerStatsParams;
  }

  let { data, params }: Props = $props();

  let diskMounts = $derived([...data.storage].sort((a, b) => b.total - a.total).slice(0, 2));

  let cpuOpen = $state(false);
  let cpuTrigger = $state<HTMLElement>();
  let memOpen = $state(false);
  let memTrigger = $state<HTMLElement>();
  let diskOpen = $state(false);
  let diskTrigger = $state<HTMLElement>();
  let tempOpen = $state(false);
  let tempTrigger = $state<HTMLElement>();

  let platformIcon = $derived(
    `https://cdn.simpleicons.org/${PLATFORM_SLUGS[data.platform.id] ?? 'linux'}`,
  );

  let tempDisplay = $derived(
    data.temperature.length > 0 ? `${data.temperature[0].temp.toFixed(1)}°C` : null,
  );

  function barColor(pct: number): string {
    if (pct >= 80) return 'var(--color-error)';
    if (pct >= 50) return 'var(--color-warning)';
    return 'var(--color-success)';
  }

  function formatMem(bytes: number): string {
    const gb = bytes / (1024 * 1024 * 1024);
    if (gb >= 1) return `${gb.toFixed(1)} GiB`;
    const mb = bytes / (1024 * 1024);
    if (mb >= 1) return `${mb.toFixed(0)} MiB`;
    return `${(bytes / 1024).toFixed(0)} KiB`;
  }

  function formatDuration(seconds: number): string {
    const d = Math.floor(seconds / 86400);
    const h = Math.floor((seconds % 86400) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const parts: string[] = [];
    if (d > 0) parts.push(`${d}d`);
    if (h > 0) parts.push(`${h}h`);
    parts.push(`${m}m`);
    return parts.join(' ');
  }

  function formatNet(bytes: number): string {
    if (bytes <= 0) return '0 B/s';
    const abs = Math.abs(bytes);
    if (abs >= 1_000_000_000) return `${(bytes / 1_000_000_000).toFixed(1)} GB/s`;
    if (abs >= 1_000_000) return `${(bytes / 1_000_000).toFixed(1)} MB/s`;
    if (abs >= 1_000) return `${(bytes / 1_000).toFixed(1)} KB/s`;
    return `${bytes.toFixed(0)} B/s`;
  }
</script>

<div class="flex flex-col gap-2">
  <div class="mb-2 flex flex-row items-center gap-3 rounded-lg">
    <div class="flex h-8 w-8 items-center">
      <img
        src={platformIcon}
        alt={data.platform.prettyName}
        class="h-full w-full"
        onerror={(e) => ((e.currentTarget as HTMLImageElement).src = brokenIcon)}
      />
    </div>
    <div class="flex flex-col">
      <span class="text-sm font-medium text-text">{data.hostname.toUpperCase()}</span>
      <div class="flex gap-3 text-xs text-text-muted">
        {#if params.showUptime}
          <span>⏱ {formatDuration(data.uptime)}</span>
        {/if}
        {#if tempDisplay}
          {@const temp = data.temperature[0].temp}
          <div
            bind:this={tempTrigger}
            class="cursor-default"
            role="button"
            tabindex="-1"
            onmouseenter={() => (tempOpen = true)}
            onmouseleave={() => (tempOpen = false)}
          >
            <span style="color: {barColor(temp)};">🌡 {tempDisplay}</span>
          </div>
          {#if data.temperature.length > 1}
            <Dropdown bind:open={tempOpen} trigger={tempTrigger} targetPortal="portal-root">
              <div class="grid min-w-44 grid-cols-2 gap-x-3 gap-y-1 px-3 py-2 text-xs">
                {#each data.temperature as t (t.name)}
                  <span class="text-text-muted">{t.name}</span>
                  <span class="text-right font-mono text-text" style="color: {barColor(t.temp)};">
                    {t.temp.toFixed(1)}°C
                  </span>
                {/each}
              </div>
            </Dropdown>
          {/if}
        {/if}
      </div>
    </div>
  </div>

  <div class="grid grid-cols-1 gap-2 sm:grid-cols-3">
    {#if params.showCpu}
      <div
        bind:this={cpuTrigger}
        class="cursor-default rounded-lg"
        role="button"
        tabindex="-1"
        onmouseenter={() => (cpuOpen = true)}
        onmouseleave={() => (cpuOpen = false)}
      >
        <div class="mb-1 flex items-center justify-between text-xs">
          <span class="font-medium text-text">CPU</span>
          <span class="font-mono font-semibold" style="color: {barColor(data.cpu.usagePercent)};">
            {data.cpu.usagePercent.toFixed(1)}%
          </span>
        </div>
        <div class="mb-1 h-2 w-full overflow-hidden rounded-full">
          <div
            class="h-full rounded-full transition-all duration-500"
            style="width: {Math.min(data.cpu.usagePercent, 100)}%; background-color: {barColor(
              data.cpu.usagePercent,
            )};"
          ></div>
        </div>
        <div class="h-2 w-full overflow-hidden rounded-full">
          <div
            class="h-full rounded-full transition-all duration-500"
            style="width: {Math.min(data.cpu.iowaitPercent, 100)}%; background-color: {barColor(
              data.cpu.iowaitPercent,
            )};"
          ></div>
        </div>
      </div>
    {/if}

    <Dropdown bind:open={cpuOpen} trigger={cpuTrigger} targetPortal="portal-root">
      <div class="grid min-w-44 grid-cols-2 gap-x-3 gap-y-1 px-3 py-2 text-xs">
        <span class="text-text-muted">Usage</span>
        <span class="text-right font-mono text-text">{data.cpu.usagePercent.toFixed(1)}%</span>
        <span class="text-text-muted">I/O Wait</span>
        <span class="text-right font-mono text-text">{data.cpu.iowaitPercent.toFixed(1)}%</span>
        <span class="text-text-muted">Load 1m</span>
        <span class="text-right font-mono text-text">{data.cpu.loadAvg[0].toFixed(2)}</span>
        <span class="text-text-muted">Load 5m</span>
        <span class="text-right font-mono text-text">{data.cpu.loadAvg[1].toFixed(2)}</span>
        <span class="text-text-muted">Load 15m</span>
        <span class="text-right font-mono text-text">{data.cpu.loadAvg[2].toFixed(2)}</span>
        <span class="text-text-muted">Cores</span>
        <span class="text-right font-mono text-text">{data.cpu.cores}</span>
      </div>
    </Dropdown>

    {#if params.showMemory}
      <div
        bind:this={memTrigger}
        class="cursor-default rounded-lg"
        role="button"
        tabindex="-1"
        onmouseenter={() => (memOpen = true)}
        onmouseleave={() => (memOpen = false)}
      >
        <div class="mb-1 flex items-center justify-between text-xs">
          <span class="font-medium text-text">RAM</span>
          <span class="font-mono font-semibold" style="color: {barColor(data.memory.percent)};">
            {data.memory.percent.toFixed(1)}%
          </span>
        </div>
        <div class="mb-1 h-2 w-full overflow-hidden rounded-full">
          <div
            class="h-full rounded-full transition-all duration-500"
            style="width: {Math.min(data.memory.percent, 100)}%; background-color: {barColor(
              data.memory.percent,
            )};"
          ></div>
        </div>
        {#if params.showSwap && data.swap.total > 0}
          <div class="h-2 w-full overflow-hidden rounded-full">
            <div
              class="h-full rounded-full transition-all duration-500"
              style="width: {Math.min(data.swap.percent, 100)}%; background-color: {barColor(
                data.swap.percent,
              )};"
            ></div>
          </div>
        {/if}
      </div>
    {/if}

    <Dropdown bind:open={memOpen} trigger={memTrigger} targetPortal="portal-root">
      <div class="grid min-w-44 grid-cols-2 gap-x-3 gap-y-1 px-3 py-2 text-xs">
        <span class="text-text-muted">Memory</span>
        <span class="text-right font-mono text-text">
          {formatMem(data.memory.used)} / {formatMem(data.memory.total)}
        </span>
        {#if params.showSwap && data.swap.total > 0}
          <span class="text-text-muted">Swap</span>
          <span class="text-right font-mono text-text">
            {formatMem(data.swap.used)} / {formatMem(data.swap.total)}
          </span>
        {/if}
      </div>
    </Dropdown>

    {#if params.showStorage && diskMounts.length > 0}
      <div
        bind:this={diskTrigger}
        class="cursor-default rounded-lg"
        role="button"
        tabindex="-1"
        onmouseenter={() => (diskOpen = true)}
        onmouseleave={() => (diskOpen = false)}
      >
        {#each diskMounts as disk, i (disk.mount)}
          <div class={diskMounts.length > 1 && disk !== diskMounts[0] ? 'mt-1.5' : ''}>
            {#if i == 0}
              <div class="mb-0.5 flex items-center justify-between text-xs">
                <span class="font-mono font-medium text-text">DISK</span>
                <span class="font-mono font-semibold" style="color: {barColor(disk.percent)};">
                  {disk.percent.toFixed(0)}%
                </span>
              </div>
            {/if}
            <div class="h-2 w-full overflow-hidden rounded-full bg-surface">
              <div
                class="h-full rounded-full transition-all duration-500"
                style="width: {Math.min(disk.percent, 100)}%; background-color: {barColor(
                  disk.percent,
                )};"
              ></div>
            </div>
          </div>
        {/each}
      </div>
    {/if}

    <Dropdown bind:open={diskOpen} trigger={diskTrigger} targetPortal="portal-root">
      <div class="flex min-w-44 flex-col gap-1 px-3 py-2 text-xs">
        {#each data.storage as disk (disk.mount)}
          <div class="grid grid-cols-2 gap-x-3 gap-y-0.5">
            <span class="truncate font-mono text-text-muted">{disk.mount}</span>
            <span class="text-right font-mono text-text">
              {formatMem(disk.used)} / {formatMem(disk.total)}
            </span>
          </div>
        {/each}
      </div>
    </Dropdown>
  </div>

  {#if params.showDiskIO && data.diskIO.length > 0}
    <div class="mt-1 flex flex-col gap-1">
      <span
        class="inline-block self-start rounded-md bg-surface-raised px-2 py-0.5 font-mono text-xs font-medium tracking-wider text-text"
        >DISK I/O</span
      >
      <div class="ml-3 flex flex-col gap-1">
        {#each data.diskIO as disk (disk.name)}
          <div class="flex items-center justify-between rounded-lg text-xs">
            <span class="font-mono font-medium text-text">{disk.name}</span>
            <span class="flex gap-2">
              <span
                class="inline-flex items-center gap-1 rounded-md bg-info/10 px-2 py-0.5 font-mono text-xs text-info"
              >
                <span class="font-semibold">R</span> {formatNet(disk.readBytes)}
              </span>
              <span
                class="inline-flex items-center gap-1 rounded-md bg-warning/10 px-2 py-0.5 font-mono text-xs text-warning"
              >
                <span class="font-semibold">W</span> {formatNet(disk.writeBytes)}
              </span>
            </span>
          </div>
        {/each}
      </div>
    </div>
  {/if}

  {#if params.showNetwork && data.network.interfaces.length > 0}
    <div class="mt-1 flex flex-col gap-1">
      <span
        class="inline-block self-start rounded-md bg-surface-raised px-2 py-0.5 font-mono text-xs font-medium tracking-wider text-text"
        >NETWORK</span
      >
      <div class="ml-3 flex flex-col gap-1">
        {#each data.network.interfaces as net (net.name)}
          <div class="flex items-center justify-between rounded-lg text-xs">
            <span class="font-mono font-medium text-text">{net.name}</span>
            <span class="flex gap-2">
              <span
                class="inline-flex items-center gap-1 rounded-md bg-info/10 px-2 py-0.5 font-mono text-xs text-info"
              >
                &darr; {formatNet(net.rxBytes)}
              </span>
              <span
                class="inline-flex items-center gap-1 rounded-md bg-warning/10 px-2 py-0.5 font-mono text-xs text-warning"
              >
                &uarr; {formatNet(net.txBytes)}
              </span>
            </span>
          </div>
        {/each}
      </div>
    </div>
  {/if}
</div>
