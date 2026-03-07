#!/bin/bash
# Daily backup of production DB (love_scrum)
# Run via crontab: 0 3 * * * /path/to/backup.sh

BACKUP_DIR="/Users/hungphu/Documents/AI_Projects/love-scrum/backend/backups"
DB_NAME="love_scrum"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
FILENAME="${BACKUP_DIR}/${DB_NAME}_${TIMESTAMP}.sql.gz"

# Dump + compress
pg_dump -U hungphu "$DB_NAME" | gzip > "$FILENAME"

# Keep only last 30 days
find "$BACKUP_DIR" -name "*.sql.gz" -mtime +30 -delete

echo "✅ Backup: $FILENAME ($(du -h "$FILENAME" | cut -f1))"
