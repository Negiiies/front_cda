# Stage 1: Dependencies
FROM node:18-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# Stage 2: Builder
FROM node:18-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Create optimized next.config.js
RUN echo 'const nextConfig = { output: "standalone", eslint: { ignoreDuringBuilds: true } }; module.exports = nextConfig' > next.config.js

# Build application
RUN npm run build

# Stage 3: Production
FROM node:18-alpine AS runner
WORKDIR /app

# Copy built application (standalone includes only production dependencies)
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3001
ENV PORT=3001
CMD ["node", "server.js"]