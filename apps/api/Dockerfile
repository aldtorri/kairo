FROM node:22-slim

# Install pnpm
RUN npm install -g pnpm

WORKDIR /app

# Copy workspace config
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY tsconfig.json ./

# Copy package manifests
COPY packages/analyzer/package.json ./packages/analyzer/
COPY packages/generator/package.json ./packages/generator/
COPY packages/runner/package.json ./packages/runner/
COPY packages/classifier/package.json ./packages/classifier/
COPY packages/fixer/package.json ./packages/fixer/
COPY packages/mcp/package.json ./packages/mcp/
COPY apps/api/package.json ./apps/api/

# Install all deps
RUN pnpm install --frozen-lockfile

# Copy source
COPY packages/ ./packages/
COPY apps/api/ ./apps/api/

# Build dependency packages then api
RUN pnpm --filter @kairo/analyzer --filter @kairo/generator \
    --filter @kairo/runner --filter @kairo/classifier \
    --filter @kairo/fixer build
RUN pnpm --filter @kairo/mcp build
RUN pnpm --filter @kairo/api build

EXPOSE 3000

CMD ["node", "apps/api/dist/index.js"]
