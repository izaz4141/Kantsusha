import { fetchURL } from '$lib/utils/network';
import logger from '$lib/server/logger';
import type { ServerStatsData } from '$lib/types/widget.data';
import type { ServerStatsParams, ServerSourceFilters } from '$lib/types/widget.params';

interface BeszelSystem {
  id: string;
  name: string;
  status: string;
  info: {
    h?: string;
    c?: number;
    t?: number;
    ct?: number;
    m?: string;
    u?: number;
    cpu?: number;
    mp?: number;
    dp?: number;
    dt?: number;
    la?: [number, number, number];
    bb?: number;
    efs?: Record<string, number>;
    b?: number;
    k?: string;
    v?: string;
    [key: string]: unknown;
  };
}

interface BeszelSystemDetails {
  hostname?: string;
  kernel?: string;
  cores?: number;
  threads?: number;
  cpu?: string;
  os?: string | number;
  os_name?: string;
  arch?: string;
  memory?: number;
}

interface BeszelStatsPayload {
  cpu?: number;
  cpub?: number[];
  m?: number;
  mu?: number;
  mp?: number;
  s?: number;
  su?: number;
  d?: number;
  du?: number;
  dp?: number;
  dr?: number;
  dw?: number;
  ns?: number;
  nr?: number;
  b?: [number, number];
  t?: Record<string, number>;
  efs?: Record<string, { d: number; du: number; r?: number; w?: number; rb?: number; wb?: number }>;
  la?: [number, number, number];
  dio?: [number, number];
  ni?: Record<string, [number, number, number, number]>;
}

const OS_NAMES: Record<number | string, string> = {
  0: 'linux',
  1: 'macos',
  2: 'windows',
};

function buildMemory(
  m: number | undefined,
  mu: number | undefined,
  mp: number | undefined,
  totalBytes: number | undefined,
): ServerStatsData['memory'] {
  if (m !== undefined && mu !== undefined && mp !== undefined) {
    const total = totalBytes ?? m * 1024 ** 3;
    const used = mu * 1024 ** 3;
    return { total, used, available: total - used, percent: mp };
  }
  if (mp !== undefined && totalBytes) {
    const used = totalBytes * (mp / 100);
    return { total: totalBytes, used, available: totalBytes - used, percent: mp };
  }
  return { total: 0, available: 0, used: 0, percent: 0 };
}

function parseTemperatures(t: Record<string, number> | undefined): ServerStatsData['temperature'] {
  if (!t) return [];
  return Object.entries(t).map(([name, temp]) => ({ name, temp }));
}

function parsePlatform(details: BeszelSystemDetails | null): ServerStatsData['platform'] {
  if (!details) return { id: 'linux', prettyName: 'Linux' };
  const id = OS_NAMES[details.os as string | number] ?? String(details.os ?? 'linux');
  const name = details.os_name || id;
  return { id, prettyName: name };
}

function matchSystem(system: BeszelSystem, idOrName: string): boolean {
  const lower = idOrName.toLowerCase();
  return system.id === idOrName || system.name.toLowerCase() === lower;
}

function parseStats(raw: unknown): BeszelStatsPayload | null {
  if (!raw) return null;
  if (typeof raw === 'string') {
    try {
      return JSON.parse(raw) as BeszelStatsPayload;
    } catch {
      return null;
    }
  }
  return raw as BeszelStatsPayload;
}

async function enrichSystem(
  system: BeszelSystem,
  token: string,
  baseUrl: string,
  params: ServerStatsParams,
  filters?: ServerSourceFilters,
): Promise<ServerStatsData> {
  const [details, stats] = await Promise.all([
    (async () => {
      try {
        return (await fetchURL(
          `${baseUrl}/api/collections/system_details/records/${system.id}?fields=hostname,kernel,cores,threads,cpu,os,os_name,arch,memory`,
          {
            customHeaders: { Authorization: `Bearer ${token}` },
            returnText: false,
          },
        )) as BeszelSystemDetails;
      } catch {
        return null;
      }
    })(),
    (async () => {
      try {
        const statsUrl = new URL(`${baseUrl}/api/collections/system_stats/records`);
        statsUrl.searchParams.set('filter', `(type='1m'&&system='${system.id}')`);
        statsUrl.searchParams.set('sort', '-created');
        statsUrl.searchParams.set('perPage', '1');
        statsUrl.searchParams.set('fields', 'stats');
        const res = (await fetchURL(statsUrl.toString(), {
          customHeaders: { Authorization: `Bearer ${token}` },
          returnText: false,
        })) as { items: Array<{ stats: unknown }> };
        if (res.items.length > 0) {
          return parseStats(res.items[0].stats);
        }
      } catch {
        /* non-critical */
      }
      return null;
    })(),
  ]);

  const info = system.info;
  const filterSet = {
    network: filters?.networkInterfaces ? new Set(filters.networkInterfaces) : null,
    disk: filters?.diskDevices ? new Set(filters.diskDevices) : null,
    mount: filters?.mountPoints ? new Set(filters.mountPoints) : null,
  };

  const primaryStorage: ServerStatsData['storage'] =
    stats?.d !== undefined
      ? [
          {
            mount: '/',
            fs: 'unknown',
            total: stats.d * 1024 ** 3,
            used: stats.du !== undefined ? stats.du * 1024 ** 3 : 0,
            available: (stats.d - (stats.du ?? 0)) * 1024 ** 3,
            percent: stats.dp ?? ((stats.du ?? 0) / stats.d) * 100,
          },
        ]
      : [];

  const extraStorage: ServerStatsData['storage'] = stats?.efs
    ? Object.entries(stats.efs).map(([mount, fs]) => ({
        mount,
        fs: 'unknown',
        total: fs.d * 1024 ** 3,
        used: fs.du * 1024 ** 3,
        available: (fs.d - fs.du) * 1024 ** 3,
        percent: (fs.du / fs.d) * 100,
      }))
    : [];

  const storageFallback: ServerStatsData['storage'] = [];
  if (primaryStorage.length === 0 && extraStorage.length === 0) {
    if (info.efs) {
      for (const [mount, percent] of Object.entries(info.efs)) {
        storageFallback.push({
          mount,
          fs: 'unknown',
          total: 0,
          used: 0,
          available: 0,
          percent: percent as number,
        });
      }
    } else if (info.dp !== undefined) {
      storageFallback.push({
        mount: '/',
        fs: 'unknown',
        total: 0,
        used: 0,
        available: 0,
        percent: info.dp,
      });
    }
  }

  const allStorage = [...primaryStorage, ...extraStorage];
  const storage =
    allStorage.length > 0
      ? allStorage.filter((d) => !filterSet.mount || filterSet.mount.has(d.mount))
      : storageFallback;

  const networkInterfaces = stats?.ni
    ? Object.entries(stats.ni).map(([name, vals]) => ({
        name,
        rxBytes: vals[0],
        txBytes: vals[1],
      }))
    : [];

  const networkFallback = stats?.b
    ? [{ name: 'total', rxBytes: stats.b[0], txBytes: stats.b[1] }]
    : info.bb
      ? [{ name: 'total', rxBytes: info.bb, txBytes: 0 }]
      : [];

  const diskIOs: ServerStatsData['diskIO'] = [];

  if (stats?.dio) {
    diskIOs.push({ name: '/', readBytes: stats.dio[0], writeBytes: stats.dio[1] });
  } else if (stats?.dr !== undefined || stats?.dw !== undefined) {
    diskIOs.push({
      name: '/',
      readBytes: (stats.dr ?? 0) * 1_048_576,
      writeBytes: (stats.dw ?? 0) * 1_048_576,
    });
  }

  if (stats?.efs) {
    for (const [mount, fs] of Object.entries(stats.efs)) {
      if (fs.rb !== undefined || fs.wb !== undefined) {
        diskIOs.push({ name: mount, readBytes: fs.rb ?? 0, writeBytes: fs.wb ?? 0 });
      } else if (fs.r !== undefined || fs.w !== undefined) {
        diskIOs.push({
          name: mount,
          readBytes: (fs.r ?? 0) * 1_048_576,
          writeBytes: (fs.w ?? 0) * 1_048_576,
        });
      }
    }
  }

  return {
    hostname: details?.hostname ?? info.h ?? system.name,
    cpu: {
      usagePercent: params.showCpu ? (stats?.cpu ?? info.cpu ?? 0) : 0,
      loadAvg: params.showCpu ? (stats?.la ?? info.la ?? [0, 0, 0]) : [0, 0, 0],
      cores: details?.cores ?? info.ct ?? info.c ?? 1,
      iowaitPercent: params.showCpu ? (stats?.cpub?.[2] ?? 0) : 0,
    },
    memory: params.showMemory
      ? buildMemory(stats?.m, stats?.mu, stats?.mp ?? info.mp, details?.memory)
      : { total: 0, available: 0, used: 0, percent: 0 },
    swap: (() => {
      if (!params.showSwap) return { total: 0, used: 0, percent: 0 };
      if (stats?.s !== undefined && stats?.su !== undefined) {
        const total = stats.s * 1024 ** 3;
        const used = stats.su * 1024 ** 3;
        return { total, used, percent: stats.s > 0 ? (stats.su / stats.s) * 100 : 0 };
      }
      return { total: 0, used: 0, percent: 0 };
    })(),
    uptime: params.showUptime ? (info.u ?? 0) : 0,
    platform: params.showPlatform
      ? parsePlatform(details)
      : { id: 'unknown', prettyName: 'Unknown' },
    temperature: params.showTemperature
      ? parseTemperatures(stats?.t)
      : info.dt !== undefined
        ? [{ name: 'cpu', temp: info.dt }]
        : [],
    storage: params.showStorage ? storage : [],
    network:
      params.showNetwork && networkInterfaces.length > 0
        ? {
            interfaces: networkInterfaces.filter(
              (n) => !filterSet.network || filterSet.network.has(n.name),
            ),
          }
        : params.showNetwork && networkFallback.length > 0
          ? { interfaces: networkFallback }
          : { interfaces: [] },
    diskIO:
      params.showDiskIO && diskIOs.length > 0
        ? diskIOs.filter((io) => !filterSet.disk || filterSet.disk.has(io.name))
        : [],
  };
}

export async function collectBeszelStats(
  url: string,
  email: string,
  password: string,
  systemIds: Record<string, ServerSourceFilters> | undefined,
  params: ServerStatsParams,
): Promise<{ data: ServerStatsData[]; errors: string[] }> {
  const errors: string[] = [];
  const baseUrl = url.replace(/\/+$/, '');

  let token: string;
  try {
    const authRes = (await fetchURL(`${baseUrl}/api/collections/users/auth-with-password`, {
      method: 'POST',
      body: JSON.stringify({ identity: email, password }),
      returnText: false,
      customHeaders: { 'Content-Type': 'application/json' },
    })) as { token: string; admin?: unknown };
    token = authRes.token;
  } catch (err) {
    logger.error(err, 'Beszel auth failed');
    errors.push('Failed to authenticate with Beszel');
    return { data: [], errors };
  }

  let systems: BeszelSystem[];
  try {
    const sysRes = (await fetchURL(
      `${baseUrl}/api/collections/systems/records?page=1&perPage=500`,
      {
        customHeaders: { Authorization: `Bearer ${token}` },
        returnText: false,
      },
    )) as { items: BeszelSystem[] };
    systems = sysRes.items;
  } catch (err) {
    logger.error(err, 'Failed to fetch Beszel systems');
    errors.push('Failed to fetch systems from Beszel');
    return { data: [], errors };
  }

  const matched: Array<{ system: BeszelSystem; filters?: ServerSourceFilters }> = [];

  if (systemIds) {
    for (const key of Object.keys(systemIds)) {
      const system = systems.find((s) => matchSystem(s, key));
      if (system) {
        matched.push({ system, filters: systemIds[key] });
      } else {
        errors.push(`System "${key}" not found`);
      }
    }
  } else {
    for (const system of systems) {
      matched.push({ system });
    }
  }

  if (matched.length === 0) {
    if (errors.length === 0) errors.push('No systems found');
    return { data: [], errors };
  }

  const results = await Promise.all(
    matched.map(({ system, filters }) => enrichSystem(system, token, baseUrl, params, filters)),
  );

  return { data: results, errors };
}
