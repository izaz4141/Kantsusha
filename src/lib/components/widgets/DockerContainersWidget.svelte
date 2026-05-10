<script lang="ts">
  import type { DockerContainerData, BaseWidgetInfo } from '$lib/types/widget.data';
  import type { DockerContainer } from '$lib/types/widget.params';

  interface Props {
    result: BaseWidgetInfo;
    class?: string;
  }

  let { result, class: className = '' }: Props = $props();

  let containers = $derived(
    result.params.type === 'docker-containers'
      ? (result.params.containers as Record<string, DockerContainer>)
      : {},
  );
  let statuses = $derived(result.data as DockerContainerData[]);

  function resolveIcon(icon: string): string | null {
    if (icon.startsWith('sh:')) return null;
    if (icon.startsWith('/')) return icon;
    return icon;
  }

  function getStatusColor(
    status: DockerContainerData['status'],
    health: DockerContainerData['health'],
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

<div class="rounded-lg border border-border bg-surface p-4 {className}">
  {#if statuses.length === 0}
    <div class="flex items-center justify-center py-4">
      <span class="text-text-muted">No containers found</span>
    </div>
  {:else}
    <ul class="space-y-2">
      {#each statuses as container (container.name)}
        {@const config = containers[container.name]}
        <li class="flex h-12 items-center gap-2 rounded">
          <div class="flex h-full w-[10%] items-center justify-center">
            {#if config?.icon}
              {#if resolveIcon(config.icon)}
                <img
                  src={resolveIcon(config.icon)}
                  alt={config.name}
                  class="h-8 w-8 object-contain"
                />
              {:else}
                <div class="flex h-8 w-8 items-center justify-center rounded bg-primary">
                  <span class="text-xs font-bold text-white">
                    {config.name.charAt(0).toUpperCase()}
                  </span>
                </div>
              {/if}
            {:else}
              <div class="h-8 w-8 rounded bg-border"></div>
            {/if}
          </div>
          <div class="flex w-8/10 flex-col justify-center overflow-hidden">
            {#if config?.url}
              <a
                href={config.url}
                target="_blank"
                rel="external noopener noreferrer"
                class="truncate text-sm font-semibold text-primary"
              >
                {config.name}
              </a>
            {:else}
              <span class="truncate text-sm font-semibold text-text">
                {config?.name ?? container.name}
              </span>
            {/if}
            {#if config?.description}
              <span class="truncate text-xs text-text-muted">
                {config.description}
              </span>
            {/if}
          </div>
          <div class="flex w-[10%] items-center justify-center">
            <span class="text-lg {getStatusColor(container.status, container.health)}">
              {#if container.status === 'running' && container.health === 'healthy'}
                ●
              {:else if container.status === 'running' && container.health === 'unhealthy'}
                ✕
              {:else if container.status === 'running' && container.health === 'starting'}
                ◐
              {:else if container.status === 'running'}
                ●
              {:else if container.status === 'paused'}
                ⏸
              {:else if container.status === 'exited'}
                ○
              {:else if container.status === 'restarting'}
                ↻
              {:else if container.status === 'removing'}
                ⌫
              {:else if container.status === 'dead'}
                ✕
              {:else}
                ○
              {/if}
            </span>
          </div>
        </li>
      {/each}
    </ul>
  {/if}
</div>
