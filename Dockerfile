FROM node:22.12-alpine AS builder

WORKDIR /app

COPY package*.json ./
COPY tsconfig.json ./
COPY src/ ./src/

RUN npm install
RUN npm run build

FROM node:22.12-alpine AS release

WORKDIR /app

COPY --from=builder /app/build /app/build
COPY --from=builder /app/package.json ./
COPY --from=builder /app/package-lock.json ./

ENV NODE_ENV=production
ENV USE_SSE=true

RUN npm ci --ignore-scripts --omit-dev
RUN npm install express cors

# Expose port for SSE access
EXPOSE 3000

# Use original MCP server with SSE transport
CMD ["node", "build/index.js"]
