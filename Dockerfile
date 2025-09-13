FROM node:22.12-alpine AS builder

WORKDIR /app

COPY package*.json ./
COPY tsconfig.json ./
COPY src/ ./src/

RUN --mount=type=cache,target=/root/.npm npm install
RUN npm run build

FROM node:22.12-alpine AS release

WORKDIR /app

COPY --from=builder /app/build /app/build
COPY --from=builder /app/package.json ./
COPY --from=builder /app/package-lock.json ./
COPY http-wrapper.js ./

ENV NODE_ENV=production

RUN npm ci --ignore-scripts --omit-dev
RUN npm install express cors

# Expose port for HTTP access
EXPOSE 3000

# Use HTTP wrapper to expose MCP server via HTTP
CMD ["node", "http-wrapper.js"]
