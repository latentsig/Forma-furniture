FROM node:24-alpine AS dependencies
WORKDIR /workspace/backend
COPY backend/package.json backend/package-lock.json ./
RUN npm ci --omit=dev

FROM node:24-alpine AS runtime
ENV NODE_ENV=production
WORKDIR /workspace/backend
COPY --from=dependencies /workspace/backend/node_modules ./node_modules
COPY backend/package.json ./package.json
COPY backend/src ./src
COPY backend/drizzle ./drizzle
COPY frontend/src/catalog.ts ../frontend/src/catalog.ts
EXPOSE 4100
CMD ["node", "--experimental-strip-types", "src/server.ts"]
