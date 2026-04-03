FROM node:22-slim AS builder

RUN npm install -g pnpm

WORKDIR /app

COPY pnpm-workspace.yaml package.json tsconfig.json ./
COPY apps/dashboard/package.json ./apps/dashboard/

RUN pnpm install --frozen-lockfile

COPY apps/dashboard/ ./apps/dashboard/

# VITE_API_URL is injected at build time by Railway
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

RUN pnpm --filter @kairo/dashboard build

# Serve with nginx
FROM nginx:alpine
COPY --from=builder /app/apps/dashboard/dist /usr/share/nginx/html
COPY apps/dashboard/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
