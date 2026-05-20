#!/bin/sh
set -e

export KANTSUSHA_DATABASE_URL=${KANTSUSHA_DATABASE_URL:-./db/kantsusha.db}
export KANTSUSHA_ORIGINS=${KANTSUSHA_ORIGINS:-http://localhost:*,http://127.0.0.1:*}
export KANTSUSHA_AUTH_SECRET=${KANTSUSHA_AUTH_SECRET:-$(head -c 32 /dev/urandom | base64 | tr -d '\n')}
export KANTSUSHA_ASSETS_DIR=${KANTSUSHA_ASSETS_DIR:-/app/assets}

mkdir -p db config assets

exec bun run build/index.js
