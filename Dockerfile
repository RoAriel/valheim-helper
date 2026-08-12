# syntax=docker/dockerfile:1

FROM node:22-bookworm-slim AS dependencies

ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
WORKDIR /app

RUN corepack enable
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

FROM dependencies AS builder

COPY . .
RUN pnpm build

FROM dependencies AS production-dependencies

RUN pnpm prune --prod

FROM node:22-bookworm-slim AS runner

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3000
WORKDIR /app

RUN groupadd --system --gid 1001 valheim \
  && useradd --system --uid 1001 --gid valheim --create-home valheim

COPY --from=production-dependencies --chown=valheim:valheim /app/node_modules ./node_modules
COPY --from=builder --chown=valheim:valheim /app/dist/standalone ./

USER valheim
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:' + process.env.PORT + '/').then((response) => { if (!response.ok) process.exit(1) }).catch(() => process.exit(1))"

CMD ["node", "server.js"]
