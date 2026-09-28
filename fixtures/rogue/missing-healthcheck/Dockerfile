FROM node:22-alpine AS base
WORKDIR /app
FROM base AS dev
CMD ["node", "index.js"]
FROM base AS test
CMD ["npm", "test"]
FROM base AS test-e2e
CMD ["npm", "test"]
FROM base AS prod
COPY --from=dev /app/index.js ./
USER 1000:1000
CMD ["node", "index.js"]
