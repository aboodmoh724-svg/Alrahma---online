#!/usr/bin/env bash
set -Eeuo pipefail

APP_DIR="${APP_DIR:-/root/alrahma-reports-app}"
BACKUP_DIR="${1:-}"

if [[ -z "$BACKUP_DIR" || ! -d "$BACKUP_DIR" ]]; then
  echo "Usage: $0 /root/alrahma-backups/YYYYMMDDTHHMMSSZ" >&2
  exit 1
fi

if [[ ! -f "${BACKUP_DIR}/database.dump" ]]; then
  echo "Missing database.dump in ${BACKUP_DIR}" >&2
  exit 1
fi

if [[ ! -f "${BACKUP_DIR}/uploads.tar.gz" ]]; then
  echo "Missing uploads.tar.gz in ${BACKUP_DIR}" >&2
  exit 1
fi

if [[ -z "${DATABASE_URL:-}" && -f "${APP_DIR}/.env" ]]; then
  DATABASE_URL="$(grep -E '^DATABASE_URL=' "${APP_DIR}/.env" | tail -n 1)"
  DATABASE_URL="${DATABASE_URL#DATABASE_URL=}"
  DATABASE_URL="${DATABASE_URL%\"}"
  DATABASE_URL="${DATABASE_URL#\"}"
  DATABASE_URL="${DATABASE_URL%\'}"
  DATABASE_URL="${DATABASE_URL#\'}"
  export DATABASE_URL
fi

if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "DATABASE_URL is not set" >&2
  exit 1
fi

echo "This will restore database and uploads from:"
echo "  ${BACKUP_DIR}"
echo
echo "Run with CONFIRM_RESTORE=yes to proceed."

if [[ "${CONFIRM_RESTORE:-}" != "yes" ]]; then
  exit 2
fi

if [[ -f "${BACKUP_DIR}/SHA256SUMS" ]]; then
  (cd "$BACKUP_DIR" && sha256sum -c SHA256SUMS)
fi

pg_restore "$DATABASE_URL" --clean --if-exists --no-owner --no-acl --single-transaction "${BACKUP_DIR}/database.dump"

mkdir -p "${APP_DIR}/uploads"
tar -C "$APP_DIR" -xzf "${BACKUP_DIR}/uploads.tar.gz"

echo "Restore completed."
