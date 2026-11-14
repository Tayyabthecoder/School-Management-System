#!/bin/sh
# Backs up the SMS database and uploaded files into ./backup (see DEPLOYMENT.md, section 3).
# Run from anywhere; it changes into the repository root first. Requires the stack to be running.
set -eu

cd "$(dirname "$0")/.."
STAMP="$(date +%F)"
mkdir -p backup

echo "[backup] MongoDB -> backup/sms-$STAMP.archive.gz"
docker exec sms-mongodb sh -c 'mongodump --archive --gzip --db sms \
  -u "$MONGO_INITDB_ROOT_USERNAME" -p "$MONGO_INITDB_ROOT_PASSWORD" --authenticationDatabase admin' \
  > "backup/sms-$STAMP.archive.gz"

VOLUME="$(docker volume ls -q | grep 'backend_uploads$' | head -n 1)"
if [ -z "$VOLUME" ]; then
  echo "[backup] could not find the backend_uploads volume (check: docker volume ls)" >&2
  exit 1
fi
echo "[backup] uploads ($VOLUME) -> backup/uploads-$STAMP.tgz"
docker run --rm -v "$VOLUME":/data -v "$PWD/backup":/backup alpine \
  tar czf "/backup/uploads-$STAMP.tgz" -C /data .

echo "[backup] done"
