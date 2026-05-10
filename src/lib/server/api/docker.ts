import type { DockerContainerData } from '$lib/types/widget.data';
import type { DockerContainersParams } from '$lib/types/widget.params';

function getDockerHost(params: DockerContainersParams): string {
  if (params['sockPath']) {
    return params['sockPath'];
  }
  const envHost = process.env.DOCKER_HOST;
  if (envHost) {
    return envHost;
  }
  return '/var/run/docker.sock';
}

function buildDockerUrl(host: string, path: string): string {
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

interface DockerStats {
  cpu_stats: {
    cpu_usage: { total_usage: number };
    system_cpu_usage: number;
    online_cpus: number;
  };
  precpu_stats: {
    cpu_usage: { total_usage: number };
    system_cpu_usage: number;
  };
  memory_stats: {
    usage: { usage: number; limit: number };
    stats: { cache: number };
  };
}

function calculateCpuPercent(stats: DockerStats): number {
  const cpuDelta = stats.cpu_stats.cpu_usage.total_usage - stats.precpu_stats.cpu_usage.total_usage;
  const systemDelta = stats.cpu_stats.system_cpu_usage - stats.precpu_stats.system_cpu_usage;
  const cpuCount = stats.cpu_stats.online_cpus || 1;

  if (systemDelta > 0 && cpuDelta > 0) {
    return (cpuDelta / systemDelta) * cpuCount * 100;
  }
  return 0;
}

function calculateMemoryPercent(stats: DockerStats): number {
  const usage = stats.memory_stats.usage.usage - (stats.memory_stats.stats.cache || 0);
  const limit = stats.memory_stats.usage.limit;
  if (limit > 0) {
    return (usage / limit) * 100;
  }
  return 0;
}

async function fetchContainerData(
  host: string,
  containerName: string,
): Promise<DockerContainerData> {
  const inspectUrl = buildDockerUrl(host, `/v1.54/containers/${containerName}/json`);
  const statsUrl = buildDockerUrl(host, `/v1.54/containers/${containerName}/stats?stream=false`);

  const inspectResponse = await fetch(inspectUrl, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!inspectResponse.ok) {
    if (inspectResponse.status === 404) {
      return {
        name: containerName,
        image: 'unknown',
        status: 'exited',
        health: null,
        state: 'Not Found',
        statusText: 'Not Found',
        cpuPercent: 0,
        memoryUsage: 0,
        memoryLimit: 0,
        memoryPercent: 0,
      };
    }
    throw new Error(`Docker API error: ${inspectResponse.status}`);
  }

  const container = await inspectResponse.json();
  const image = container.Config?.Image || 'unknown';

  const status = (container.State?.Status?.toLowerCase() ||
    'created') as DockerContainerData['status'];
  const health = (container.State?.Health?.status?.toLowerCase() ||
    null) as DockerContainerData['health'];

  let cpuPercent = 0;
  let memoryUsage = 0;
  let memoryLimit = 0;
  let memoryPercent = 0;

  if (status === 'running') {
    try {
      const statsResponse = await fetch(statsUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (statsResponse.ok) {
        const stats: DockerStats = await statsResponse.json();
        cpuPercent = calculateCpuPercent(stats);
        memoryUsage = stats.memory_stats.usage.usage - (stats.memory_stats.stats.cache || 0);
        memoryLimit = stats.memory_stats.usage.limit;
        memoryPercent = calculateMemoryPercent(stats);
      }
    } catch {
      // Stats fetch failed, keep defaults
    }
  }

  return {
    name: containerName,
    image,
    status,
    health,
    state: container.State?.Status || 'Unknown',
    statusText: container.State?.Status || 'Unknown',
    cpuPercent: Number(cpuPercent.toFixed(2)),
    memoryUsage,
    memoryLimit,
    memoryPercent: Number(memoryPercent.toFixed(2)),
  };
}

export async function fetchDockerContainers(
  params: DockerContainersParams,
): Promise<DockerContainerData[]> {
  const host = getDockerHost(params);
  const containerNames = Object.keys(params.containers);

  const results: DockerContainerData[] = [];
  for (const containerName of containerNames) {
    const data = await fetchContainerData(host, containerName);
    results.push(data);
  }

  return results;
}
