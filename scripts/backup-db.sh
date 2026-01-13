#!/bin/bash
#
# Database Backup Script for PAYGSite
# Designed for CloudPanel / Ubuntu environments with PostgreSQL
#
# Usage: ./backup-db.sh
# Cron example (daily at 2am): 0 2 * * * /path/to/backup-db.sh
#

set -e

# Configuration - Update these values
DB_NAME="${DB_NAME:-paygsite}"
DB_USER="${DB_USER:-paygsite}"
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"

# Backup settings
BACKUP_DIR="${BACKUP_DIR:-/home/cloudpanel/backups/paygsite}"
RETENTION_DAYS="${RETENTION_DAYS:-30}"

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

# Generate timestamp for filename
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="$BACKUP_DIR/paygsite_$TIMESTAMP.sql.gz"

echo "Starting backup at $(date)"
echo "Database: $DB_NAME"
echo "Backup file: $BACKUP_FILE"

# Create compressed backup
# Uses PGPASSWORD env var or ~/.pgpass for authentication
pg_dump \
  -h "$DB_HOST" \
  -p "$DB_PORT" \
  -U "$DB_USER" \
  -d "$DB_NAME" \
  --no-owner \
  --no-acl \
  --clean \
  --if-exists \
  | gzip > "$BACKUP_FILE"

# Verify backup was created
if [ -f "$BACKUP_FILE" ]; then
  BACKUP_SIZE=$(ls -lh "$BACKUP_FILE" | awk '{print $5}')
  echo "Backup completed successfully"
  echo "File size: $BACKUP_SIZE"
else
  echo "ERROR: Backup file was not created"
  exit 1
fi

# Remove old backups beyond retention period
echo "Removing backups older than $RETENTION_DAYS days..."
find "$BACKUP_DIR" -name "paygsite_*.sql.gz" -type f -mtime +$RETENTION_DAYS -delete

# List remaining backups
echo ""
echo "Current backups:"
ls -lh "$BACKUP_DIR"/paygsite_*.sql.gz 2>/dev/null || echo "No backups found"

echo ""
echo "Backup completed at $(date)"
