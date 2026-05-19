# Services Widget

Display links with status checks for services and Docker containers.

## Parameters

| Parameter  | Type      | Required | Default    | Description       |
| ---------- | --------- | -------- | ---------- | ----------------- |
| `type`     | string    | Yes      | -          | `services`        |
| `title`    | string    | No       | `Services` | `services`        |
| `services` | Service[] | Yes      | -          | Array of services |
| `column`   | number    | No       | `3`        | Grid columns      |
| `target`   | string    | No       | `_blank`   | Link target       |

### Service Types

#### Endpoint

```yaml
- type: endpoint
  name: Jellyfin
  icon: di:jellyfin
  url: https://jf.example.com
  description: Media server
  target: _blank
  statusCheck: true
  statusCheckUrl: http://jellyfin:8096
```

#### Container

```yaml
- type: container
  id: jellyfin
  sockPath: tcp://socket-proxy:2375
  name: Jellyfin
  icon: di:jellyfin
  url: https://jf.example.com
  description: Media server
  target: _blank
```

## Example

```yaml
- type: services
  column: 4
  services:
    - type: endpoint
      name: Jellyfin
      icon: di:jellyfin
      url: https://jf.example.com
      statusCheck: true
      statusCheckUrl: http://jellyfin:8096
    - type: endpoint
      name: Plex
      icon: di:plex
      url: https://plex.example.com
      statusCheck: true
      statusCheckUrl: http://plex:32400
    - type: container
      id: nginx-proxy
      sockPath: tcp://docker-host:2375
      name: Nginx Proxy
      icon: simple-icons:nginx
      url: https://proxy.example.com
```

## Icon Format

Use `di:name` for Devicons or `simple-icons:name` for Simple Icons.

## Use Cases

- Service dashboard
- Selfhosted app links
- Docker container monitoring
