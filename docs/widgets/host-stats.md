# Host Stats Widget

Display live system metrics: CPU, memory, swap, disk, disk I/O, network, temperature, and platform info.

## Parameters

| Parameter           | Type     | Required | Default    | Description                         |
| ------------------- | -------- | -------- | ---------- | ----------------------------------- |
| `type`              | string   | Yes      | -          | `host-stats`                        |
| `title`             | string   | No       | Host Stats | Widget title                        |
| `frameless`         | boolean  | No       | `false`    | Hide header                         |
| `showCpu`           | boolean  | No       | `true`     | Show CPU usage and load             |
| `showMemory`        | boolean  | No       | `true`     | Show memory usage                   |
| `showSwap`          | boolean  | No       | `true`     | Show swap usage                     |
| `showUptime`        | boolean  | No       | `true`     | Show system uptime                  |
| `showPlatform`      | boolean  | No       | `true`     | Show OS icon and name               |
| `showTemperature`   | boolean  | No       | `true`     | Show CPU temperature                |
| `showStorage`       | boolean  | No       | `true`     | Show disk usage per mount           |
| `showDiskIO`        | boolean  | No       | `true`     | Show disk I/O throughput per device |
| `showNetwork`       | boolean  | No       | `true`     | Show network throughput             |
| `networkInterfaces` | string[] | No       | all        | Filter visible network interfaces   |
| `diskDevices`       | string[] | No       | all        | Filter visible disk devices         |
| `mountPoints`       | string[] | No       | all        | Filter visible mount points         |
| `cache`             | string   | No       | `15m`      | Cache duration                      |
| `update`            | string   | No       | `15m`      | Update interval                     |

## Data Sources

All data is read from the host filesystem:

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

### Platform Icons

The OS icon uses [SimpleIcons](https://simpleicons.org/) via the `PLATFORM_SLUGS` mapping. Unrecognized distros fall back to the generic Linux icon.

## Example

```yaml
- type: host-stats
  title: Server
  showCpu: true
  showMemory: true
  showNetwork: true
  networkInterfaces:
    - eth0
    - wlan0
```

```yaml
- type: host-stats
  showStorage: true
  mountPoints:
    - /
    - /mnt/data
  frameless: true
```

```yaml
- type: host-stats
  showDiskIO: true
  diskDevices:
    - sda
    - nvme0n1
```

## Use Cases

- Server monitoring dashboard
- Quick system overview
- Sidebar panel with host resource metrics
