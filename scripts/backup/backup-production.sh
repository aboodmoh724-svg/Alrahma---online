#!/usr/bin/env bash
set -Eeuo pipefail

APP_DIR="${APP_DIR:-/root/alrahma-reports-app}"
BACKUP_ROOT="${BACKUP_ROOT:-/root/alrahma-backups}"
RETENTION_DAYS="${RETENTION_DAYS:-30}"
TIMESTAMP="$(date -u +%Y%m%dT%H%M%SZ)"
BACKUP_DIR="${BACKUP_ROOT}/${TIMESTAMP}"
LOG_FILE="${BACKUP_ROOT}/backup.log"

mkdir -p "$BACKUP_DIR"
touch "$LOG_FILE"
chmod 700 "$BACKUP_ROOT" "$BACKUP_DIR"

log() {
  printf '%s %s\n' "$(date -u +%Y-%m-%dT%H:%M:%SZ)" "$*" | tee -a "$LOG_FILE"
}

load_database_url() {
  if [[ -n "${DATABASE_URL:-}" ]]; then
    return
  fi

  if [[ -f "${APP_DIR}/.env" ]]; then
    DATABASE_URL="$(grep -E '^DATABASE_URL=' "${APP_DIR}/.env" | tail -n 1)"
    DATABASE_URL="${DATABASE_URL#DATABASE_URL=}"
    DATABASE_URL="${DATABASE_URL%\"}"
    DATABASE_URL="${DATABASE_URL#\"}"
    DATABASE_URL="${DATABASE_URL%\'}"
    DATABASE_URL="${DATABASE_URL#\'}"
    export DATABASE_URL
  fi
}

require_command() {
  command -v "$1" >/dev/null 2>&1 || {
    log "ERROR: required command not found: $1"
    exit 1
  }
}

load_database_url
require_command pg_dump
require_command tar
require_command sha256sum

if [[ -z "${DATABASE_URL:-}" ]]; then
  log "ERROR: DATABASE_URL is not set"
  exit 1
fi

log "Starting backup into ${BACKUP_DIR}"

pg_dump "$DATABASE_URL" --format=custom --no-owner --no-acl --file="${BACKUP_DIR}/database.dump"

if [[ -d "${APP_DIR}/uploads" ]]; then
  tar -C "$APP_DIR" -czf "${BACKUP_DIR}/uploads.tar.gz" uploads
else
  tar -czf "${BACKUP_DIR}/uploads.tar.gz" --files-from /dev/null
fi

git -C "$APP_DIR" rev-parse HEAD > "${BACKUP_DIR}/git-commit.txt" 2>/dev/null || true
git -C "$APP_DIR" status --short > "${BACKUP_DIR}/git-status.txt" 2>/dev/null || true

cat > "${BACKUP_DIR}/README.txt" <<EOF
Alrahma production backup
Created UTC: ${TIMESTAMP}
App directory: ${APP_DIR}
Database: database.dump
Uploads: uploads.tar.gz

Restore with:
  ${APP_DIR}/scripts/backup/restore-production.sh ${BACKUP_DIR}
EOF

(
  cd "$BACKUP_DIR"
  sha256sum database.dump uploads.tar.gz git-commit.txt git-status.txt README.txt > SHA256SUMS
)

find "$BACKUP_ROOT" -mindepth 1 -maxdepth 1 -type d -mtime "+${RETENTION_DAYS}" -name '20*Z' -exec rm -rf {} \;

log "Backup completed: ${BACKUP_DIR}"
