# syntax=docker/dockerfile:1.7

# ---- deps ---------------------------------------------------------------
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# ---- build --------------------------------------------------------------
FROM node:20-alpine AS builder
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
# Dummy DATABASE_URL: prisma.config.ts validates env() at load time, even for `generate`.
# Real URL is injected by Render at runtime.
ENV DATABASE_URL="postgresql://build:build@localhost:5432/build?schema=public"
ENV BETTER_AUTH_SECRET="build-time-dummy-not-used-at-runtime"
ENV BETTER_AUTH_URL="http://localhost:3000"
RUN npx prisma generate
RUN npm run build
# Drop dev-only deps (eslint, vitest, typescript, etc.) before the runner copy.
# Prisma CLI is in dependencies so it survives prune and is available for migrate deploy.
RUN npm prune --omit=dev

# ---- runner -------------------------------------------------------------
FROM node:20-alpine AS runner
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV HOSTNAME=0.0.0.0

RUN addgroup --system --gid 1001 nodejs \
    && adduser --system --uid 1001 nextjs

# Standalone server bundle
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# Prisma assets needed at runtime for `migrate deploy`
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/prisma.config.ts ./prisma.config.ts
# Full node_modules: Prisma 7's @prisma/dev pulls in transitive deps (valibot, etc.)
# that aren't reachable via cherry-picked package copies. Disk is cheaper than
# tracking the closure manually.
COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nextjs:nodejs /app/package.json ./package.json

USER nextjs
EXPOSE 3000

# Invoke the real prisma entry point (not the .bin shim) so the WASM/asset
# files in node_modules/prisma/build/ resolve relative to the binary.
# Render injects $PORT; Next standalone honours it via HOSTNAME=0.0.0.0.
CMD ["sh", "-c", "node node_modules/prisma/build/index.js migrate deploy && node server.js"]
