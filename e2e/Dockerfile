# base stage
FROM node:22-alpine AS base
WORKDIR /app
RUN corepack enable
COPY package*.json pnpm-lock.yaml* pnpm-workspace.yaml* ./
RUN pnpm install --frozen-lockfile

# test stage
FROM base AS test
COPY . .
RUN touch .env
CMD ["pnpm", "test"]
