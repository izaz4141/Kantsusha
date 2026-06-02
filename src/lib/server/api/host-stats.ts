import { existsSync, readFileSync, statfsSync, readdirSync } from 'node:fs';
import { hostname as osHostname } from 'node:os';
import logger from '$lib/server/logger';
import type { HostStatsData } from '$lib/types/widget.data';
import type { HostStatsParams } from '$lib/types/widget.params';

const PROC_BASE = existsSync('/host/proc/stat') ? '/host/proc' : '/proc';
const ETC_BASE = existsSync('/host/etc/os-release') ? '/host/etc' : '/etc';
const SYS_BASE = existsSync('/host/sys/class/thermal') ? '/host/sys' : '/sys';

function readProc(path: string): string {
  return readFileSync(`${PROC_BASE}/${path}`, 'utf-8');
}

function readEtc(path: string): string | null {
  try {
    return readFileSync(`${ETC_BASE}/${path}`, 'utf-8');
  } catch {
    return null;
  }
}

function parseMeminfo(): HostStatsData['memory'] | null {
  try {
    const text = readProc('meminfo');
    const totalMatch = text.match(/MemTotal:\s+(\d+)\s+kB/);
    const availableMatch = text.match(/MemAvailable:\s+(\d+)\s+kB/);
    if (!totalMatch) return null;
    const total = parseInt(totalMatch[1], 10) * 1024;
    const available = availableMatch ? parseInt(availableMatch[1], 10) * 1024 : 0;
    const used = total - available;
    return { total, available, used, percent: total > 0 ? (used / total) * 100 : 0 };
  } catch (err) {
    logger.error(err, 'Failed to parse memory stats from /proc/meminfo');
    return null;
  }
}

function parseSwap(): HostStatsData['swap'] | null {
  try {
    const text = readProc('meminfo');
    const totalMatch = text.match(/SwapTotal:\s+(\d+)\s+kB/);
    const freeMatch = text.match(/SwapFree:\s+(\d+)\s+kB/);
    if (!totalMatch) return null;
    const total = parseInt(totalMatch[1], 10) * 1024;
    const free = freeMatch ? parseInt(freeMatch[1], 10) * 1024 : 0;
    const used = total - free;
    return { total, used, percent: total > 0 ? (used / total) * 100 : 0 };
  } catch (err) {
    logger.error(err, 'Failed to parse swap stats from /proc/meminfo');
    return null;
  }
}

function parseStatCpu(): { idle: number; total: number; iowait: number } | null {
  try {
    const text = readProc('stat');
    const line = text.split('\n').find((l) => l.startsWith('cpu '));
    if (!line) return null;
    const parts = line.trim().split(/\s+/).slice(1).map(Number);
    if (parts.length < 5) return null;
    const idle = parts[3];
    const iowait = parts[4];
    const total = parts.reduce((a, b) => a + b, 0);
    return { idle, total, iowait };
  } catch (err) {
    logger.error(err, 'Failed to parse CPU stat from /proc/stat');
    return null;
  }
}

function parseLoadAvg(): [number, number, number] | null {
  try {
    const text = readProc('loadavg');
    const parts = text.trim().split(/\s+/);
    return [parseFloat(parts[0]), parseFloat(parts[1]), parseFloat(parts[2])];
  } catch (err) {
    logger.error(err, 'Failed to parse load average from /proc/loadavg');
    return null;
  }
}

function parseCpuCores(): number {
  try {
    const text = readProc('stat');
    return text.split('\n').filter((l) => l.startsWith('cpu')).length - 1;
  } catch (err) {
    logger.error(err, 'Failed to parse CPU core count from /proc/stat');
    return 1;
  }
}

function parseHostname(): string {
  const fromEtc = readEtc('hostname');
  if (fromEtc) return fromEtc.trim();
  try {
    return readProc('sys/kernel/hostname').trim();
  } catch {
    return osHostname();
  }
}
}

function parseUptime(): number | null {
  try {
    const text = readProc('uptime');
    return Math.floor(parseFloat(text.trim().split(/\s+/)[0]));
  } catch (err) {
    logger.error(err, 'Failed to parse uptime from /proc/uptime');
    return null;
  }
}

function parsePlatform(): HostStatsData['platform'] | null {
  try {
    const text = readEtc('os-release');
    if (!text) return null;
    const idMatch = text.match(/^ID=(.+)$/m);
    const prettyMatch = text.match(/^PRETTY_NAME="(.+)"$/m) ?? text.match(/^PRETTY_NAME=(.+)$/m);
    return {
      id: idMatch ? idMatch[1].trim() : 'linux',
      prettyName: prettyMatch ? prettyMatch[1].trim() : 'Linux',
    };
  } catch (err) {
    logger.error(err, 'Failed to detect platform from /etc/os-release');
    return null;
  }
}

function parseTemperature(): HostStatsData['temperature'] {
  try {
    const zones = readdirSync(`${SYS_BASE}/class/thermal`).filter((d) =>
      d.startsWith('thermal_zone'),
    );
    const results: HostStatsData['temperature'] = [];
    for (const zone of zones) {
      try {
        const type = readFileSync(`${SYS_BASE}/class/thermal/${zone}/type`, 'utf-8').trim();
        const raw = readFileSync(`${SYS_BASE}/class/thermal/${zone}/temp`, 'utf-8').trim();
        results.push({ name: type, temp: parseInt(raw, 10) / 1000 });
      } catch (err) {
        logger.error(err, `Failed to read thermal zone ${zone}`);
        continue;
      }
    }
    return results;
  } catch (err) {
    logger.error(err, 'Failed to list thermal zones from /sys/class/thermal');
    return [];
  }
}

function parseStorage(filterMounts?: string[]): HostStatsData['storage'] {
  const SKIP_FS = new Set([
    'proc',
    'sysfs',
    'tmpfs',
    'devtmpfs',
    'devpts',
    'cgroup',
    'cgroup2',
    'pstore',
    'securityfs',
    'selinuxfs',
    'autofs',
    'hugetlbfs',
    'mqueue',
    'debugfs',
    'tracefs',
    'configfs',
    'efivarfs',
    'bpf',
    'overlay',
    'squashfs',
    'ramfs',
    'fusectl',
    'nsfs',
    'pipefs',
    'sockfs',
    'sunrpc',
    'cpuset',
    'binfmt_misc',
    'rpc_pipefs',
    'fuse.portal',
  ]);
  try {
    const text = readProc('mounts');
    const lines = text.split('\n').filter((l) => l.trim());
    const results: HostStatsData['storage'] = [];
    for (const line of lines) {
      const parts = line.trim().split(/\s+/);
      if (parts.length < 3) continue;
      const mount = parts[1].replace(/\\040/g, ' ');
      const fs = parts[2];
      if (SKIP_FS.has(fs)) continue;
      try {
        const s = statfsSync(mount);
        const total = Number(s.blocks) * s.bsize;
        const available = Number(s.bavail) * s.bsize;
        const used = total - available;
        results.push({
          mount,
          fs,
          total,
          used,
          available,
          percent: total > 0 ? (used / total) * 100 : 0,
        });
      } catch (err) {
        logger.error(err, `Failed to stat mount point: ${mount}`);
        continue;
      }
    }
    if (filterMounts) {
      const set = new Set(filterMounts);
      return results.filter((r) => set.has(r.mount));
    }
    return results;
  } catch (err) {
    logger.error(err, 'Failed to parse disk storage from /proc/mounts');
    return [];
  }
}

interface NetDevSample {
  name: string;
  rxBytes: number;
  txBytes: number;
}

function parseNetDev(): NetDevSample[] {
  const text = readProc('net/dev');
  const lines = text.split('\n').slice(2);
  const interfaces: NetDevSample[] = [];
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    const [iface, rest] = trimmed.split(':');
    const name = iface.trim();
    if (name === 'lo') continue;
    const parts = rest.trim().split(/\s+/);
    const rxBytes = parseInt(parts[0], 10);
    const txBytes = parseInt(parts[8], 10);
    if (!isNaN(rxBytes) && !isNaN(txBytes)) {
      interfaces.push({ name, rxBytes, txBytes });
    }
  }
  return interfaces;
}

async function collectCpu(): Promise<{
  usagePercent: number;
  loadAvg: [number, number, number];
  cores: number;
  iowaitPercent: number;
} | null> {
  try {
    const first = parseStatCpu();
    if (!first) return null;
    await new Promise((r) => setTimeout(r, 500));
    const second = parseStatCpu();
    if (!second) return null;
    const idleDelta = second.idle - first.idle;
    const totalDelta = second.total - first.total;
    const iowaitDelta = second.iowait - first.iowait;
    const usagePercent = totalDelta > 0 ? (1 - idleDelta / totalDelta) * 100 : 0;
    const iowaitPercent = totalDelta > 0 ? (iowaitDelta / totalDelta) * 100 : 0;
    const loadAvg = parseLoadAvg() ?? [0, 0, 0];
    const cores = parseCpuCores();
    return { usagePercent, loadAvg, cores, iowaitPercent };
  } catch (err) {
    logger.error(err, 'Failed to collect CPU metrics (500ms sample)');
    return null;
  }
}

async function collectNetwork(
  filterInterfaces?: string[],
): Promise<HostStatsData['network'] | null> {
  try {
    const first = parseNetDev();
    if (first.length === 0) return null;
    await new Promise((r) => setTimeout(r, 500));
    const second = parseNetDev();
    const interval = 0.5;
    const interfaces = second.map((s) => {
      const prev = first.find((f) => f.name === s.name);
      return {
        name: s.name,
        rxBytes: prev ? (s.rxBytes - prev.rxBytes) / interval : 0,
        txBytes: prev ? (s.txBytes - prev.txBytes) / interval : 0,
      };
    });
    const set = filterInterfaces ? new Set(filterInterfaces) : null;
    const filtered = set ? interfaces.filter((i) => set.has(i.name)) : interfaces;
    return { interfaces: filtered };
  } catch (err) {
    logger.error(err, 'Failed to collect network metrics (500ms sample)');
    return null;
  }
}

interface DiskIOSample {
  name: string;
  readBytes: number;
  writeBytes: number;
}

function parseDiskstats(): DiskIOSample[] {
  const text = readProc('diskstats');
  return text
    .split('\n')
    .filter((l) => l.trim())
    .map((l) => {
      const parts = l.trim().split(/\s+/);
      return {
        name: parts[2],
        readBytes: (parseInt(parts[5], 10) || 0) * 512,
        writeBytes: (parseInt(parts[9], 10) || 0) * 512,
      };
    })
    .filter((d) => !d.name.startsWith('loop') && !d.name.startsWith('ram'));
}

async function collectDiskIO(filterDevices?: string[]): Promise<HostStatsData['diskIO'] | null> {
  try {
    const first = parseDiskstats();
    if (first.length === 0) return null;
    await new Promise((r) => setTimeout(r, 500));
    const second = parseDiskstats();
    const interval = 0.5;
    const devices = second.map((s) => {
      const prev = first.find((f) => f.name === s.name);
      return {
        name: s.name,
        readBytes: prev ? Math.round((s.readBytes - prev.readBytes) / interval) : 0,
        writeBytes: prev ? Math.round((s.writeBytes - prev.writeBytes) / interval) : 0,
      };
    });
    const set = filterDevices ? new Set(filterDevices) : null;
    const filtered = set ? devices.filter((d) => set.has(d.name)) : devices;
    return filtered;
  } catch (err) {
    logger.error(err, 'Failed to collect disk I/O metrics');
    return null;
  }
}

export async function collectHostStats(
  params: HostStatsParams,
): Promise<{ data: HostStatsData; errors: string[] }> {
  const errors: string[] = [];
  const hostname = parseHostname();
  const [cpu, memory, swap, uptime, platform, temperature, storage, network, diskIO] =
    await Promise.all([
      params.showCpu ? collectCpu() : null,
      params.showMemory ? parseMeminfo() : null,
      params.showSwap ? parseSwap() : null,
      params.showUptime ? parseUptime() : null,
      params.showPlatform ? parsePlatform() : null,
      params.showTemperature ? parseTemperature() : null,
      params.showStorage ? parseStorage(params.mountPoints) : null,
      params.showNetwork ? collectNetwork(params.networkInterfaces) : null,
      params.showDiskIO ? collectDiskIO(params.diskDevices) : null,
    ]);
  if (!cpu) errors.push('Failed to collect CPU stats');
  if (!memory) errors.push('Failed to collect memory stats');
  if (!swap) errors.push('Failed to collect swap stats');
  if (!uptime) errors.push('Failed to collect uptime');
  if (!platform) errors.push('Failed to detect platform');
  if (!network) errors.push('Failed to collect network stats');
  return {
    data: {
      hostname,
      cpu: cpu ?? { usagePercent: 0, loadAvg: [0, 0, 0], cores: 1, iowaitPercent: 0 },
      memory: memory ?? { total: 0, available: 0, used: 0, percent: 0 },
      swap: swap ?? { total: 0, used: 0, percent: 0 },
      uptime: uptime ?? 0,
      platform: platform ?? { id: 'unknown', prettyName: 'Unknown' },
      temperature: temperature ?? [],
      storage: storage ?? [],
      network: network ?? { interfaces: [] },
      diskIO: diskIO ?? [],
    },
    errors,
  };
}
