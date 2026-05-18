# Deployment

## Environment Variables

```bash
KANTSUSHA_DATABASE_URL=./db/kantsusha.db  # SQLite database
KANTSUSHA_ORIGINS="http://localhost:*,http://127.0.0.1:*"
KANTSUSHA_AUTH_SECRET="your-32-char-secret"  # Required for production
```

## Docker

### Image

```dockerfile
FROM oven/bun:1-alpine
WORKDIR /app
COPY package.json bun.lockb ./
RUN bun install --production
COPY . .
RUN bun run build
EXPOSE 3000
CMD ["bun", "run", "start"]
```

### Docker Compose

```yaml
services:
  kantsusha:
    container_name: kantsusha
    image: ghcr.io/izaz4141/kantsusha:latest
    restart: unless-stopped
    user: nadeko
    volumes:
      - ./db:/app/db:Z,U
      - ./config:/app/config:Z,U
    ports:
      - 3000:3000
    environment:
      KANTSUSHA_DATABASE_URL: ./db/kantsusha.db
      KANTSUSHA_ORIGINS: 'https://d1.example.com:443,https://d2.example.com:443'
      KANTSUSHA_AUTH_SECRET: '32longsecret'
```

## Reverse Proxy (Nginx)

```nginx
location / {
  proxy_pass http://localhost:3000;
  proxy_http_version 1.1;
  proxy_set_header Upgrade $http_upgrade;
  proxy_set_header Connection 'upgrade';
  proxy_set_header Host $host;
  proxy_cache_bypass $http_upgrade;
}
```

## HTTPS

Use Cloudflare or Traefik for automatic HTTPS.