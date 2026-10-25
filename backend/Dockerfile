# Stage 1: Build & Dependencies
FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev

# Stage 2: Production Runner
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=5000

# Run container under unprivileged user for security
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

COPY --from=deps /app/node_modules ./node_modules
COPY package*.json ./
COPY src ./src
COPY seed ./seed

# Create logs and uploads directory and assign ownership to appuser
RUN mkdir -p logs uploads && chown -R appuser:appgroup /app

USER appuser

EXPOSE 5000

CMD ["node", "src/server.js"]
