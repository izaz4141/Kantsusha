# Server Stats Widget

Display live system metrics: CPU, memory, swap, disk, disk I/O, network, temperature, and platform info.

## Parameters

| Parameter         | Type    | Required | Default        | Description                          |
| ----------------- | ------- | -------- | -------------- | ------------------------------------ |
| `type`            | string  | Yes      | -              | `server-stats`                       |
| `title`           | string  | No       | Server Stats   | Widget title                         |
| `source`          | -       | No       | `{ host: {} }` | Data source with filters (see below) |
| `frameless`       | boolean | No       | `false`        | Hide header                          |
| `showCpu`         | boolean | No       | `true`         | Show CPU usage and load              |
| `showMemory`      | boolean | No       | `true`         | Show memory usage                    |
| `showSwap`        | boolean | No       | `true`         | Show swap usage                      |
| `showUptime`      | boolean | No       | `true`         | Show system uptime                   |
| `showPlatform`    | boolean | No       | `true`         | Show OS icon and name                |
| `showTemperature` | boolean | No       | `true`         | Show CPU temperature                 |
| `showStorage`     | boolean | No       | `true`         | Show disk usage per mount            |
| `showDiskIO`      | boolean | No       | `true`         | Show disk I/O throughput per device  |
| `showNetwork`     | boolean | No       | `true`         | Show network throughput              |
| `cache`           | string  | No       | `15m`          | Cache duration                       |
| `update`          | string  | No       | `15m`          | Update interval                      |

## Source

The `source` parameter controls where metrics are collected from and can include per-source filters.

### `host` (default)

Collects metrics directly from the local host filesystem.

```yaml
# minimal — no filters
source: { host: {} }

# with filters
source:
  host:
    networkInterfaces:
      - eth0
    diskDevices:
      - sda
    mountPoints:
      - /
      - /mnt/data
```

**Host metrics**:

| Metric      | Source                        |
| ----------- | ----------------------------- |
| CPU         | `/proc/stat`, `/proc/loadavg` |
| Memory      | `/proc/meminfo`               |
| Swap        | `/proc/meminfo`               |
| Uptime      | `/proc/uptime`                |
| Platform    | `/etc/os-release`             |
| Temperature | `/sys/class/thermal/`         |
| Storage     | `/proc/mounts` + `statfs()`   |
| Disk I/O    | `/proc/diskstats`             |
| Network     | `/proc/net/dev`               |

When running in a container, the widget looks for `/host/proc`, `/host/etc`, and `/host/sys` prefixes (bind-mounted host paths).

### `beszel`

Fetches metrics from a [Beszel](https://beszel.dev) monitoring server via its PocketBase REST API.

```yaml
- type: server-stats
  source:
    beszel:
      url: http://beszel:8090
      email: admin@example.com
      password: secret123
      systemIds: # optional — record of systemId → per-system filters
        abc123:
          networkInterfaces:
            - eth0
        def456: {}
```

When `systemIds` is omitted, **all** systems from the Beszel hub are displayed. Each system renders as its own card.

### Source filters reference

| Filter              | Type     | Description                       |
| ------------------- | -------- | --------------------------------- |
| `networkInterfaces` | string[] | Filter visible network interfaces |
| `diskDevices`       | string[] | Filter visible disk devices       |
| `mountPoints`       | string[] | Filter visible mount points       |

### Platform Icons

The OS icon uses [SimpleIcons](https://simpleicons.org/) via the `PLATFORM_SLUGS` mapping. Unrecognized distros fall back to the generic Linux icon.

## Examples

```yaml
- type: server-stats
  title: Server
  showCpu: true
  showMemory: true
  showNetwork: true
  source:
    host:
      networkInterfaces:
        - eth0
        - wlan0
```

```yaml
- type: server-stats
  showStorage: true
  frameless: true
  source:
    host:
      mountPoints:
        - /
        - /mnt/data
```

```yaml
- type: server-stats
  showDiskIO: true
  source:
    host:
      diskDevices:
        - sda
        - nvme0n1
```

```yaml
- type: server-stats
  source:
    beszel:
      url: http://beszel:8090
      email: admin@example.com
      password: secret123
      systemIds:
        my-server:
          networkInterfaces:
            - eth0
        web-01: {}
```

## Use Cases

- Server monitoring dashboard
- Quick system overview
- Sidebar panel with host resource metrics
- Remote server monitoring via Beszel
