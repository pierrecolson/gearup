# syntax=docker/dockerfile:1.7

# ---- deps ------------------------------------------------------------------
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

# ---- builder ---------------------------------------------------------------
FROM node:22-alpine AS builder
WORKDIR /app

# NEXT_PUBLIC_* vars are inlined into the client bundle at build time.
# Surface them as ARG so docker-compose can pass them through.
ARG NEXT_PUBLIC_LOGODEV_KEY
ENV NEXT_PUBLIC_LOGODEV_KEY=$NEXT_PUBLIC_LOGODEV_KEY
ENV NEXT_TELEMETRY_DISABLED=1

COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# ---- runner ----------------------------------------------------------------
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Non-root user.
RUN addgroup -g 1001 -S nodejs && adduser -S nextjs -u 1001

# Next.js standalone bundle: a self-contained server.js + just the deps it
# actually imports. .next/static and public/ are copied alongside.
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# Pre-create data/ so the bind-mount has a known parent. Volume contents
# at /app/data override this — it just guarantees the path exists when no
# volume is mounted (e.g. for `docker run` smoke tests).
RUN mkdir -p ./data && chown -R nextjs:nodejs ./data

USER nextjs
EXPOSE 3000
CMD ["node", "server.js"]
