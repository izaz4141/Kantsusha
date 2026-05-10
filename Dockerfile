# Build stage
FROM oven/bun:alpine AS build

WORKDIR /app

COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

COPY . .
RUN bun run build

RUN rm -rf node_modules && bun install --frozen-lockfile --production

# Production stage
FROM oven/bun:alpine

WORKDIR /app

COPY --from=build /app/build ./build
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json ./package.json

RUN export CONF_USER=$(getent passwd 1000 | cut -d: -f1) && \
    export CONF_GROUP=$(getent group 1000 | cut -d: -f1) && \
    [ -n "$CONF_USER" ] && deluser "$CONF_USER" || true && \
    [ -n "$CONF_GROUP" ] && delgroup "$CONF_GROUP" || true && \
    addgroup -g 1000 nadeko && \
    adduser -u 1000 -G nadeko -s /bin/sh -D nadeko

ENV NODE_ENV=production

HEALTHCHECK --interval=30m --timeout=10s --start-period=5s --retries=3 \
    CMD wget -q --spider http://localhost:3000/ || exit 1

EXPOSE 3000

USER nadeko
ENTRYPOINT ["/entrypoint.sh"]
