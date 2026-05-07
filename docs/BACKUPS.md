# Production Backups

Backups are stored on the VPS under:

```sh
/root/alrahma-backups
```

Each backup contains:

- `database.dump`: PostgreSQL custom-format dump.
- `uploads.tar.gz`: local uploaded files.
- `git-commit.txt`: deployed commit at backup time.
- `git-status.txt`: local production worktree status.
- `SHA256SUMS`: integrity checks.

Useful commands on the VPS:

```sh
cd /root/alrahma-reports-app
scripts/backup/list-backups.sh
scripts/backup/backup-production.sh
CONFIRM_RESTORE=yes scripts/backup/restore-production.sh /root/alrahma-backups/YYYYMMDDTHHMMSSZ
```

The restore command is intentionally guarded by `CONFIRM_RESTORE=yes`.
