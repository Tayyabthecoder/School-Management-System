# Stage 1: Build & Dependencies
FROM node:25-alpine@sha256:bdf2cca6fe3dabd014ea60163eca3f0f7015fbd5c7ee1b0e9ccb4ced6eb02ef4 AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev

# Stage 2: Production Runner
FROM node:25-alpine@sha256:bdf2cca6fe3dabd014ea60163eca3f0f7015fbd5c7ee1b0e9ccb4ced6eb02ef4 AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=5000
# Local-day logic (attendance dates, "today" ranges) follows the school's calendar, not UTC
ENV TZ=Asia/Karachi
ENV SCHOOL_TIMEZONE=Asia/Karachi
RUN apk add --no-cache tzdata

# Run container under unprivileged user for security
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

COPY --from=deps /app/node_modules ./node_modules
COPY package*.json ./
COPY src ./src
# seed/ is deliberately not copied: it creates demo accounts with known passwords.
COPY scripts ./scripts

# Create logs and uploads directory and assign ownership to appuser
RUN mkdir -p logs uploads && chown -R appuser:appgroup /app

USER appuser

EXPOSE 5000

HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 CMD node -e "fetch('http://127.0.0.1:5000/api/v1/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "src/server.js"]
