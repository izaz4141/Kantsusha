import type { ContainerData } from '$lib/types/widget.data';
import type { ContainerParams, ServicesParams } from '$lib/types/widget.params';

export function getContainerHost(params: ContainerParams): string {
  if (params['sockPath']) {
    return params['sockPath'];
  }
  const envHost = process.env.DOCKER_HOST;
  if (envHost) {
    return envHost;
  }
  return '/var/run/docker.sock';
}

function buildContainerUrl(host: string, path: string): string {
  if (host.startsWith('unix://') || host.startsWith('/')) {
    const socketPath = host.replace('unix://', '');
    const encodedPath = encodeURIComponent(socketPath);
    return `http+unix://${encodedPath}${path}`;
  }
  if (host.startsWith('tcp://')) {
    return `http://${host.replace('tcp://', '')}${path}`;
  }
  const encodedPath = encodeURIComponent('/var/run/docker.sock');
  return `http+unix://${encodedPath}${path}`;
}

interface ContainerStats {
  cpu_stats: {
    cpu_usage: { total_usage: number; percpu_usage?: number[] };
    system_cpu_usage: number;
    online_cpus: number;
  };
  precpu_stats: {
    cpu_usage: { total_usage: number };
    system_cpu_usage: number;
  };
  memory_stats: {
    usage: number;
    max_usage?: number;
    stats?: Record<string, number>;
    limit?: number;
  };
}

function calculateCpuPercent(stats: ContainerStats): number {
  const cpuDelta = stats.cpu_stats.cpu_usage.total_usage - stats.precpu_stats.cpu_usage.total_usage;
  const systemDelta = stats.cpu_stats.system_cpu_usage - stats.precpu_stats.system_cpu_usage;
  const cpuCount =
    stats.cpu_stats.online_cpus ?? stats.cpu_stats.cpu_usage.percpu_usage?.length ?? 1;

  if (systemDelta > 0 && cpuDelta > 0) {
    return (cpuDelta / systemDelta) * cpuCount * 100;
  }
  return 0;
}

function calculateMemoryUsage(stats: ContainerStats): number {
  const usage = stats.memory_stats.usage;
  const cache = stats.memory_stats.stats?.inactive_file ?? stats.memory_stats.stats?.cache ?? 0;
  return usage - cache;
}

function calculateMemoryPercent(stats: ContainerStats): number {
  const usage = calculateMemoryUsage(stats);
  const limit = stats.memory_stats.limit ?? stats.memory_stats.max_usage ?? 0;
  if (limit > 0) {
    return (usage / limit) * 100;
  }
  return 0;
}

async function fetchTwoStatsSnapshots(
  host: string,
  containerName: string,
): Promise<[ContainerStats, ContainerStats] | null> {
  const statsUrl = buildContainerUrl(host, `/v1.54/containers/${containerName}/stats?stream=true`);

  const response = await fetch(statsUrl, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok || !response.body) {
    await response.body?.cancel().catch(() => {});
    return null;
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  const snapshots: ContainerStats[] = [];

  try {
    while (snapshots.length < 2) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split('\n').filter((line) => line.trim());

      for (const line of lines) {
        try {
          const stats = JSON.parse(line) as ContainerStats;
          snapshots.push(stats);
          if (snapshots.length >= 2) break;
        } catch {
          continue;
        }
      }
    }
  } finally {
    await reader.cancel().catch(() => {});
  }

  if (snapshots.length < 2) {
    return null;
  }

  return [snapshots[0], snapshots[1]];
}

export async function fetchContainerData(
  host: string,
  containerName: string,
): Promise<ContainerData> {
  const inspectUrl = buildContainerUrl(host, `/v1.54/containers/${containerName}/json`);

  const inspectResponse = await fetch(inspectUrl, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!inspectResponse.ok) {
    await inspectResponse.body?.cancel().catch(() => {});
    if (inspectResponse.status === 404) {
      return {
        name: containerName,
        image: 'unknown',
        status: 'unknown',
        health: null,
        cpuPercent: 0,
        memoryUsage: 0,
        memoryLimit: 0,
        memoryPercent: 0,
        time: null,
      };
    }
    throw new Error(`Docker API error: ${inspectResponse.status}`);
  }

  const container = await inspectResponse.json();
  const image = container.Config?.Image || 'unknown';

  const status = (container.State?.Status?.toLowerCase() || 'created') as ContainerData['status'];
  const health = (container.State?.Health?.status?.toLowerCase() ||
    null) as ContainerData['health'];

  const now = Date.now();
  let time: number | null = null;
  if (status === 'running' && container.State?.StartedAt) {
    time = now - new Date(container.State.StartedAt).getTime();
  } else if (container.State?.FinishedAt) {
    time = -(now - new Date(container.State.FinishedAt).getTime());
  }

  let cpuPercent = 0;
  let memoryUsage = 0;
  let memoryLimit = 0;
  let memoryPercent = 0;

  if (status === 'running') {
    try {
      const snapshots = await fetchTwoStatsSnapshots(host, containerName);

      if (snapshots && snapshots.length >= 1) {
        const stats = snapshots[1];
        cpuPercent = calculateCpuPercent(stats);
        memoryUsage = calculateMemoryUsage(stats);
        memoryLimit = stats.memory_stats.limit || stats.memory_stats.max_usage || 0;
        memoryPercent = calculateMemoryPercent(stats);
      } else {
        console.warn(`Failed to fetch stats for ${containerName}`);
      }
    } catch (e) {
      console.warn(`Stats failed: ${containerName}`);
    }
  }

  return {
    name: containerName,
    image,
    status,
    health,
    cpuPercent: Number(cpuPercent.toFixed(2)),
    memoryUsage,
    memoryLimit,
    memoryPercent: Number(memoryPercent.toFixed(2)),
    time,
  };
}

export async function fetchContainers(params: ServicesParams): Promise<ContainerData[]> {
  const containerServices = params.services.filter((s) => s.type === 'container');

  const results: ContainerData[] = [];
  for (const container of containerServices) {
    try {
      const host = getContainerHost(container);
      const data = await fetchContainerData(host, container.id);
      results.push(data);
    } catch (e) {
      console.error('Container data failed: ', container.id, e);
    }
  }

  return results;
}
