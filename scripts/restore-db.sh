#!/bin/bash
#
# Database Restore Script for PAYGSite
# Designed for CloudPanel / Ubuntu environments with PostgreSQL
#
# Usage: ./restore-db.sh <backup_file.sql.gz>
# Example: ./restore-db.sh /home/cloudpanel/backups/paygsite/paygsite_20240115_020000.sql.gz
#

set -e

# Configuration - Update these values
DB_NAME="${DB_NAME:-paygsite}"
DB_USER="${DB_USER:-paygsite}"
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"

# Check if backup file was provided
if [ -z "$1" ]; then
  echo "Usage: $0 <backup_file.sql.gz>"
  echo ""
  echo "Available backups:"
  BACKUP_DIR="${BACKUP_DIR:-/home/cloudpanel/backups/paygsite}"
  ls -lht "$BACKUP_DIR"/paygsite_*.sql.gz 2>/dev/null | head -10 || echo "No backups found in $BACKUP_DIR"
  exit 1
fi

BACKUP_FILE="$1"

# Verify backup file exists
if [ ! -f "$BACKUP_FILE" ]; then
  echo "ERROR: Backup file not found: $BACKUP_FILE"
  exit 1
fi

echo "WARNING: This will overwrite the current database!"
echo "Database: $DB_NAME"
echo "Backup file: $BACKUP_FILE"
echo ""
read -p "Are you sure you want to continue? (yes/no): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
  echo "Restore cancelled"
  exit 0
fi

echo ""
echo "Starting restore at $(date)"

# Decompress and restore
gunzip -c "$BACKUP_FILE" | psql \
  -h "$DB_HOST" \
  -p "$DB_PORT" \
  -U "$DB_USER" \
  -d "$DB_NAME" \
  --quiet

echo ""
echo "Restore completed at $(date)"
echo ""
echo "Don't forget to run 'npx prisma migrate deploy' if there are pending migrations"
