#!/bin/sh
# Runs from the nginx image's /docker-entrypoint.d/ before nginx starts.
# Creates a self-signed certificate when none is mounted, so the HTTPS-only config
# can start out of the box. Replace with real certificates for any public hostname.
set -eu

CERT_DIR=/etc/nginx/certs
CERT_FILE="$CERT_DIR/fullchain.pem"
KEY_FILE="$CERT_DIR/privkey.pem"
CN="${TLS_COMMON_NAME:-localhost}"

if [ -s "$CERT_FILE" ] && [ -s "$KEY_FILE" ]; then
  echo "[tls] Using mounted certificate at $CERT_FILE"
  exit 0
fi

mkdir -p "$CERT_DIR"
echo "[tls] No certificate found; generating a self-signed certificate for CN=$CN"
openssl req -x509 -nodes -newkey rsa:2048 -days 365 \
  -subj "/CN=$CN" \
  -addext "subjectAltName=DNS:$CN,DNS:localhost,IP:127.0.0.1" \
  -keyout "$KEY_FILE" -out "$CERT_FILE"
chmod 600 "$KEY_FILE"
