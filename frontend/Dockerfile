FROM node:24-alpine AS dependencies
WORKDIR /workspace/frontend
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci

FROM node:24-alpine AS builder
WORKDIR /workspace/frontend
COPY --from=dependencies /workspace/frontend/node_modules ./node_modules
COPY frontend/ ./
ARG NEXT_PUBLIC_SITE_URL
ARG FORMA_API_URL=http://backend:4100
ARG APP_ENV=staging
ENV NEXT_PUBLIC_SITE_URL=${NEXT_PUBLIC_SITE_URL}
ENV FORMA_API_URL=${FORMA_API_URL}
ENV APP_ENV=${APP_ENV}
RUN npm run build

FROM node:24-alpine AS runtime
ENV NODE_ENV=production
WORKDIR /workspace/frontend
COPY --from=builder /workspace/frontend/.next/standalone ./
COPY --from=builder /workspace/frontend/.next/static ./.next/static
COPY --from=builder /workspace/frontend/public ./public
COPY --from=builder /workspace/frontend/src/server ./src/server
EXPOSE 3000
CMD ["sh", "-c", "node --experimental-strip-types src/server/validate-env.ts && node server.js"]
