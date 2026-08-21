#!/bin/sh
set -e

echo "🚀 Starting Meawland Web Container..."

# Automatically sync Prisma schema with PostgreSQL database
if [ -f "./node_modules/.bin/prisma" ]; then
  echo "📦 Applying database schema migrations..."
  ./node_modules/.bin/prisma db push || echo "⚠️ Prisma db push warning, continuing startup..."
fi

echo "✅ Database ready, launching Next.js application server..."
exec "$@"
