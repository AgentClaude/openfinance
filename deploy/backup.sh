#!/usr/bin/env bash
# backup.sh — Automated PostgreSQL backup for OpenFinance
#
# Usage:
#   ./deploy/backup.sh                    # Full backup
#   ./deploy/backup.sh --restore latest   # Restore latest backup
#   ./deploy/backup.sh --restore <file>   # Restore specific backup
#   ./deploy/backup.sh --list             # List available backups
#   ./deploy/backup.sh --prune 30         # Delete backups older than 30 days
#
# Cron (daily at 2am):
#   0 2 * * * cd /path/to/openfinance && ./deploy/backup.sh >> /var/log/openfinance-backup.log 2>&1

set -euo pipefail

BACKUP_DIR="${BACKUP_DIR:-./backups}"
CONTAINER="${DB_CONTAINER:-openfinance_db}"
DB_NAME="${POSTGRES_DB:-openfinance_production}"
DB_USER="${POSTGRES_USER:-openfinance}"
RETENTION_DAYS="${RETENTION_DAYS:-30}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/openfinance_${TIMESTAMP}.sql.gz"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log() { echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1"; }
warn() { echo -e "${YELLOW}[$(date '+%Y-%m-%d %H:%M:%S')] WARNING:${NC} $1"; }
error() { echo -e "${RED}[$(date '+%Y-%m-%d %H:%M:%S')] ERROR:${NC} $1" >&2; }

# Ensure backup directory exists
mkdir -p "${BACKUP_DIR}"

case "${1:-backup}" in
  --list|-l)
    echo "Available backups:"
    ls -lhS "${BACKUP_DIR}"/openfinance_*.sql.gz 2>/dev/null || echo "  No backups found."
    echo ""
    echo "Total: $(ls "${BACKUP_DIR}"/openfinance_*.sql.gz 2>/dev/null | wc -l | tr -d ' ') backups"
    du -sh "${BACKUP_DIR}" 2>/dev/null | awk '{print "Disk usage: "$1}'
    ;;

  --restore|-r)
    RESTORE_FILE="${2:-latest}"
    if [ "${RESTORE_FILE}" = "latest" ]; then
      RESTORE_FILE=$(ls -t "${BACKUP_DIR}"/openfinance_*.sql.gz 2>/dev/null | head -1)
      if [ -z "${RESTORE_FILE}" ]; then
        error "No backups found in ${BACKUP_DIR}"
        exit 1
      fi
    fi

    if [ ! -f "${RESTORE_FILE}" ]; then
      error "Backup file not found: ${RESTORE_FILE}"
      exit 1
    fi

    warn "This will REPLACE the current database with: ${RESTORE_FILE}"
    read -p "Are you sure? (type 'yes' to confirm): " confirm
    if [ "${confirm}" != "yes" ]; then
      echo "Restore cancelled."
      exit 0
    fi

    log "Stopping API and Sidekiq..."
    docker compose stop api sidekiq 2>/dev/null || true

    log "Restoring from ${RESTORE_FILE}..."
    gunzip -c "${RESTORE_FILE}" | docker exec -i "${CONTAINER}" psql -U "${DB_USER}" -d "${DB_NAME}" --set ON_ERROR_STOP=on

    log "Starting API and Sidekiq..."
    docker compose start api sidekiq

    log "✅ Restore complete from: ${RESTORE_FILE}"
    ;;

  --prune|-p)
    DAYS="${2:-${RETENTION_DAYS}}"
    PRUNED=$(find "${BACKUP_DIR}" -name "openfinance_*.sql.gz" -mtime "+${DAYS}" -print -delete | wc -l | tr -d ' ')
    log "Pruned ${PRUNED} backups older than ${DAYS} days"
    ;;

  backup|"")
    # Check container is running
    if ! docker inspect "${CONTAINER}" >/dev/null 2>&1; then
      error "Database container '${CONTAINER}' not found. Is Docker Compose running?"
      exit 1
    fi

    log "Starting backup of ${DB_NAME}..."

    # Create backup with pg_dump (custom format for parallel restore support)
    docker exec "${CONTAINER}" pg_dump \
      -U "${DB_USER}" \
      -d "${DB_NAME}" \
      --no-owner \
      --no-privileges \
      --clean \
      --if-exists \
      | gzip > "${BACKUP_FILE}"

    # Verify backup
    BACKUP_SIZE=$(du -h "${BACKUP_FILE}" | cut -f1)
    if [ ! -s "${BACKUP_FILE}" ]; then
      error "Backup file is empty! Something went wrong."
      rm -f "${BACKUP_FILE}"
      exit 1
    fi

    log "✅ Backup complete: ${BACKUP_FILE} (${BACKUP_SIZE})"

    # Auto-prune old backups
    PRUNED=$(find "${BACKUP_DIR}" -name "openfinance_*.sql.gz" -mtime "+${RETENTION_DAYS}" -print -delete 2>/dev/null | wc -l | tr -d ' ')
    if [ "${PRUNED}" -gt 0 ]; then
      log "Auto-pruned ${PRUNED} backups older than ${RETENTION_DAYS} days"
    fi

    # Summary
    TOTAL=$(ls "${BACKUP_DIR}"/openfinance_*.sql.gz 2>/dev/null | wc -l | tr -d ' ')
    TOTAL_SIZE=$(du -sh "${BACKUP_DIR}" 2>/dev/null | cut -f1)
    log "Backup store: ${TOTAL} backups, ${TOTAL_SIZE} total"
    ;;

  *)
    echo "Usage: $0 [backup|--list|--restore <file|latest>|--prune <days>]"
    exit 1
    ;;
esac
