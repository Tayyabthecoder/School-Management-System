# Stage 1: Build
FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Stage 2: Nginx Production Image (HTTPS on 443, HTTP 80 redirects)
FROM nginx:alpine AS runner

# openssl is only needed to create a self-signed certificate when none is mounted
RUN apk add --no-cache openssl

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY nginx/security-headers.conf /etc/nginx/snippets/security-headers.conf
COPY docker/10-generate-self-signed-cert.sh /docker-entrypoint.d/10-generate-self-signed-cert.sh
RUN sed -i 's/\r$//' /docker-entrypoint.d/10-generate-self-signed-cert.sh \
  && chmod +x /docker-entrypoint.d/10-generate-self-signed-cert.sh

EXPOSE 80 443

CMD ["nginx", "-g", "daemon off;"]
