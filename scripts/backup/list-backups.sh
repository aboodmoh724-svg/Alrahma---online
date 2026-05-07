#!/usr/bin/env bash
set -Eeuo pipefail

BACKUP_ROOT="${BACKUP_ROOT:-/root/alrahma-backups}"

if [[ ! -d "$BACKUP_ROOT" ]]; then
  echo "No backup directory found: ${BACKUP_ROOT}"
  exit 0
fi

find "$BACKUP_ROOT" -mindepth 1 -maxdepth 1 -type d -name '20*Z' -printf '%f\t%TY-%Tm-%Td %TH:%TM\t%k KB\n' | sort -r
