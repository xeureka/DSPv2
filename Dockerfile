FROM node:24-slim AS build

WORKDIR /workspace
RUN corepack enable && corepack prepare pnpm@11.23.0 --activate

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.json ./
COPY apps/back-end/package.json apps/back-end/package.json
COPY apps/front-end/package.json apps/front-end/package.json
COPY packages/shared/package.json packages/shared/package.json
RUN pnpm install --frozen-lockfile

COPY apps/back-end apps/back-end
COPY packages/shared packages/shared
RUN pnpm --filter @dspv2/backend build
RUN pnpm --filter @dspv2/backend deploy --prod /prod

FROM node:24-slim AS runtime
ENV NODE_ENV=production
WORKDIR /app
COPY --from=build /prod ./
COPY --from=build /workspace/apps/back-end/dist ./dist
EXPOSE 3001
CMD ["node", "dist/index.js"]
