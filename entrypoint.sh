#!/bin/sh
set -e

export KANTSUSHA_DATABASE_URL=${KANTSUSHA_DATABASE_URL:-./db/kantsusha.db}
export KANTSUSHA_ORIGINS=${KANTSUSHA_ORIGINS:-http://localhost:*,http://127.0.0.1:*}
export KANTSUSHA_AUTH_SECRET=${KANTSUSHA_AUTH_SECRET:-$(head -c 32 /dev/urandom | base64 | tr -d '\n')}

mkdir -p db config

exec bun run build/index.js
