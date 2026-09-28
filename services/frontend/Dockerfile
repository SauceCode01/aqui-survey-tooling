# 1. Base (Unified OS)
FROM node:22-bookworm-slim AS base
WORKDIR /app
RUN corepack enable
COPY package*.json pnpm-lock.yaml* pnpm-workspace.yaml* ./
RUN --mount=type=cache,id=pnpm,target=/root/.local/share/pnpm/store pnpm install --frozen-lockfile

# 2. Development
FROM base AS dev
COPY . .
ENV NODE_ENV=development
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
CMD ["pnpm", "dev"]

# 3. Unit & Integration Testing (Lightweight)
FROM base AS test
COPY . .
CMD ["pnpm", "test"]

# 4. E2E Testing (Heavy - Includes Playwright Browsers)
FROM base AS test-e2e
RUN npx playwright install --with-deps chromium
COPY . .
CMD ["pnpm", "test:e2e"]

# 5. Production Builder
FROM base AS builder
COPY . .
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
RUN pnpm build

# 6. Production Runtime
FROM node:22-bookworm-slim AS prod
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
ENV NEXT_TELEMETRY_DISABLED=1

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

USER node
HEALTHCHECK --interval=2s --timeout=2s --start-period=3s --retries=10 \
  CMD node -e "require('net').connect(${PORT:-3000}, '127.0.0.1').on('connect', () => process.exit(0)).on('error', () => process.exit(1))"

CMD ["node", "server.js"]