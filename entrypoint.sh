#!/bin/bash
set -e

export KANTSUSHA_DATABASE_URL=${KANTSUSHA_DATABASE_URL:-./db/kantsusha.db}
export KANTSUSHA_ORIGINS=${KANTSUSHA_DATABASE_URL:-http://localhost:*,http://127.0.0.1:*}
export KANTSUSHA_AUTH_SECRET=${KANTSUSHA_DATABASE_URL:-$(openssl rand -base64 32)}

mkdir db config

bun run build/index.js
