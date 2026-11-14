# Deployment & Operations Runbook

How to run the School Management System on a server, keep it backed up, and change things safely.
All commands assume Linux with Docker Compose v2 (`docker compose`), run from the repository root.
Container names: `sms-frontend` (nginx, TLS), `sms-backend`, `sms-mongodb`, `sms-redis`.
Named volumes: `mongo_data`, `redis_data`, `backend_uploads`, `backend_logs`.

## 1. First deployment

1. Copy the environment template and fill in every secret:

   ```bash
   cp .env.example .env
   node -e "console.log(require('crypto').randomBytes(24).toString('hex'))"   # run once per secret
   ```

   - `MONGO_ROOT_PASSWORD` and `REDIS_PASSWORD`: letters and digits only (they are embedded in URLs).
   - `JWT_SECRET` and `JWT_REFRESH_SECRET`: at least 32 characters, different from each other.
   - `CORS_ORIGIN`: the public HTTPS origin users type in the browser.
   - `TLS_COMMON_NAME`: the public host name (used only for the self-signed fallback certificate).
   - Compose refuses to start if any required secret is empty.

2. Provide a real TLS certificate (section 2), then start the stack:

   ```bash
   docker compose up -d --build
   docker compose ps          # mongodb, redis and backend should become "healthy"
   ```

3. Create the first administrator (never use the demo seed in production):

   ```bash
   docker exec -it -e ADMIN_PASSWORD='choose-a-long-secret' sms-backend npm run admin:create
   ```

4. Before exposing the server, remove the host port mappings for MongoDB and Redis in
   `docker-compose.yml` (`127.0.0.1:27017` and `127.0.0.1:6379`). The backend reaches them over the
   internal Docker network, so nothing else needs them.

## 2. TLS certificates and renewal

The nginx container reads `./certs/fullchain.pem` and `./certs/privkey.pem`. If they are missing it
generates a self-signed pair, which is fine for a trial but not for real users.

- **Install a real certificate:** place the full chain and private key at those two paths
  (`chmod 600 certs/privkey.pem`), then reload nginx without downtime:

  ```bash
  docker exec sms-frontend nginx -s reload
  ```

- **Renewal with Let's Encrypt (certbot on the host):** after each renewal copy the files and reload.
  A `renewal-hooks/deploy` script keeps this automatic:

  ```bash
  #!/bin/sh
  # /etc/letsencrypt/renewal-hooks/deploy/sms.sh
  install -m 644 /etc/letsencrypt/live/YOUR.DOMAIN/fullchain.pem /path/to/repo/certs/fullchain.pem
  install -m 600 /etc/letsencrypt/live/YOUR.DOMAIN/privkey.pem   /path/to/repo/certs/privkey.pem
  docker exec sms-frontend nginx -s reload
  ```

- Check the expiry date monthly: `openssl x509 -in certs/fullchain.pem -noout -enddate`.

## 3. Backups

Back up **both** the database and the uploads volume (student documents and photos). Keep copies
off the server and test a restore at least once per term.

Run `./scripts/backup.sh` (it needs the stack running). It writes a compressed MongoDB archive and an uploads tarball into `./backup/`, named with the date. The commands it runs, for reference:

**MongoDB (compressed archive):**

```bash
docker exec sms-mongodb sh -c 'mongodump --archive --gzip --db sms \
  -u "$MONGO_INITDB_ROOT_USERNAME" -p "$MONGO_INITDB_ROOT_PASSWORD" --authenticationDatabase admin' \
  > "backup/sms-$(date +%F).archive.gz"
```

**Uploads volume:**

```bash
VOLUME=$(docker volume ls -q | grep backend_uploads)    # the name is prefixed with the compose project
docker run --rm -v "$VOLUME":/data -v "$PWD/backup":/backup alpine \
  tar czf "/backup/uploads-$(date +%F).tgz" -C /data .
```

**Schedule it** (example: nightly at 02:00, keep 14 days):

```cron
0 2 * * * cd /path/to/repo && ./scripts/backup.sh && find backup -type f -mtime +14 -delete
```

**Restore** (this replaces current data, so stop the backend first):

```bash
docker compose stop backend
docker exec -i sms-mongodb sh -c 'mongorestore --archive --gzip --drop \
  -u "$MONGO_INITDB_ROOT_USERNAME" -p "$MONGO_INITDB_ROOT_PASSWORD" --authenticationDatabase admin' \
  < backup/sms-YYYY-MM-DD.archive.gz
docker run --rm -v "$VOLUME":/data -v "$PWD/backup":/backup alpine \
  sh -c 'rm -rf /data/* && tar xzf /backup/uploads-YYYY-MM-DD.tgz -C /data'
docker compose start backend
```

## 4. Rotating secrets

| Secret | Effect of rotating | Steps |
|---|---|---|
| `JWT_SECRET` / `JWT_REFRESH_SECRET` | Every user is signed out | Edit `.env`, then `docker compose up -d backend` |
| `REDIS_PASSWORD` | Brief rate-limit/cache reset | Edit `.env`, then `docker compose up -d redis backend` |
| `MONGO_ROOT_PASSWORD` | None, if done in order | Change the password inside MongoDB first (`db.changeUserPassword`), then edit `.env` and `docker compose up -d backend` |
| Admin / user passwords | That user is signed out | Settings > Users > reset password (the user must change it at next sign-in) |

Rotate JWT secrets immediately if `.env` or a backup containing it may have been exposed. Rotate
everything when an administrator who knew the secrets leaves.

## 5. Upgrading and rolling back

```bash
git fetch && git log --oneline HEAD..origin/main     # review what is coming
./scripts/backup.sh                                  # back up first (section 3)
git pull
docker compose build
docker compose up -d
docker compose ps && docker compose logs --tail=50 backend
```

- Base images are pinned by digest; Dependabot opens pull requests when new digests or package
  versions are available. Merge them after CI passes.
- **Roll back** the code by checking out the previous commit or tag and rebuilding
  (`git checkout <previous>`, `docker compose build`, `docker compose up -d`). If the new version
  changed data, also restore the matching backup (section 3).
- The monthly challan job runs on the 1st at 00:00 (Asia/Karachi) and the fee-overdue check daily at
  01:00. Avoid restarting the backend around those times.

## 6. Production checklist

- [ ] Real TLS certificate installed and renewal hook tested
- [ ] `.env` secrets generated, not shared, and not committed
- [ ] MongoDB and Redis host ports removed from `docker-compose.yml`
- [ ] `CORS_ORIGIN` matches the public URL
- [ ] First admin created with `admin:create`; demo seed never run
- [ ] Nightly backups running, one restore tested
- [ ] If another proxy or CDN sits in front of nginx, review `trust proxy` in `backend/src/app.js` so
      login rate limits see the real client address
- [ ] CI is green on the commit being deployed
