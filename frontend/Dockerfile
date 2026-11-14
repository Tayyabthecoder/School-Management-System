# Stage 1: Build
FROM node:22-alpine@sha256:1314fb30ec37592d5845e5a160d522c0e680972aa534549940b8d73bde88481a AS builder
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Stage 2: Nginx Production Image (HTTPS on 443, HTTP 80 redirects)
FROM nginx:alpine@sha256:fed7e14be83cbd2661a75cdc5b872d936cf155d46c327084d30b8df19ae88d72 AS runner

# openssl is only needed to create a self-signed certificate when none is mounted
RUN apk add --no-cache openssl

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY nginx/security-headers.conf /etc/nginx/snippets/security-headers.conf
COPY docker/10-generate-self-signed-cert.sh /docker-entrypoint.d/10-generate-self-signed-cert.sh
RUN sed -i 's/\r$//' /docker-entrypoint.d/10-generate-self-signed-cert.sh \
  && chmod +x /docker-entrypoint.d/10-generate-self-signed-cert.sh

EXPOSE 80 443

# Probes the HTTPS listener (self-signed in dev, hence --no-check-certificate); busybox wget ships with alpine.
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 CMD wget -q --spider --no-check-certificate https://127.0.0.1/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
