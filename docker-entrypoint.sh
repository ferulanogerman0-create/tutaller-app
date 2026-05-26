#!/bin/sh
set -e

echo "→ Running database migrations..."
node_modules/tsx/dist/cli.mjs scripts/migrate.ts || {
  echo "⚠ Migration failed, continuing anyway (idempotent CREATE IF NOT EXISTS)"
}

echo "→ Seeding admin user..."
node_modules/tsx/dist/cli.mjs scripts/seed.ts || {
  echo "⚠ Seed failed, continuing"
}

echo "→ Starting Next.js server..."
exec node server.js
