# ==============================================================================
# Production-Grade Multi-Stage Dockerfile for Meawland (Next.js 16 + Turbopack)
# Optimized for: Small Image Size, Layer Caching, Security (Non-Root), & Reliability
# ==============================================================================

ARG NODE_VERSION=22-bookworm-slim

# ------------------------------------------------------------------------------
# Stage 1: Dependencies Installation (deps)
# ------------------------------------------------------------------------------
FROM node:${NODE_VERSION} AS deps
WORKDIR /app

# Install system utilities needed for native builds and Prisma
RUN apt-get update && apt-get install -y --no-install-recommends \
    openssl \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Enable PNPM package manager matching package.json packageManager definition
RUN corepack enable && corepack prepare pnpm@11.13.0 --activate

# Copy package descriptors and Prisma schema (required for prisma generate on install)
COPY package.json pnpm-lock.yaml* ./
COPY prisma ./prisma/
COPY prisma.config.ts ./

# Install dependencies with frozen lockfile using Docker BuildKit cache
RUN --mount=type=cache,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile

# ------------------------------------------------------------------------------
# Stage 2: Application Build (builder)
# ------------------------------------------------------------------------------
FROM node:${NODE_VERSION} AS builder
WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    openssl \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

RUN corepack enable && corepack prepare pnpm@11.13.0 --activate

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy full application source code
COPY . .

# Set build-time environment variables
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV SKIP_ENV_VALIDATION=1

# Generate Prisma client for Linux target and build Next.js standalone application
RUN pnpm prisma:generate && pnpm build

# ------------------------------------------------------------------------------
# Stage 3: Production Runner (runner)
# ------------------------------------------------------------------------------
FROM node:${NODE_VERSION} AS runner
WORKDIR /app

# Install curl for Docker healthchecks & OpenSSL for Prisma engine runtime
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    openssl \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Set production runtime environment variables
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
ENV NEXT_TELEMETRY_DISABLED=1

# Create unprivileged application user
RUN groupadd --system --gid 1001 nodejs && \
    useradd --system --uid 1001 nextjs -g nodejs

# Copy public static assets and standalone build output
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma

# Prepare runtime cache directories with correct ownership
RUN mkdir -p .next/cache && chown -R nextjs:nodejs .next

# Switch to non-root user for security best practices
USER nextjs

# Expose Next.js server port
EXPOSE 3000

# Built-in Docker Health Check
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD curl -f http://127.0.0.1:3000/api/health || exit 1

# Start Next.js standalone server
CMD ["node", "server.js"]