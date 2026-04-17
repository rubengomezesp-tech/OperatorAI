#!/usr/bin/env bash
set -e

DATE=$(date +%Y%m%d-%H%M)
BACKUP_DIR="$HOME/Desktop/OperatorAI-Backups"

echo ""
echo "🔒 Backing up Operator AI..."
echo ""

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Code backup
echo "  → Backing up code..."
tar -czf "$BACKUP_DIR/code-$DATE.tar.gz" -C "$HOME" operator-ai --exclude=node_modules --exclude=.next --exclude=ios/App/Pods

# iCloud copy
if [ -d "$HOME/Library/Mobile Documents/com~apple~CloudDocs" ]; then
  echo "  → Copying to iCloud..."
  mkdir -p "$HOME/Library/Mobile Documents/com~apple~CloudDocs/OperatorAI-Backups"
  cp "$BACKUP_DIR/code-$DATE.tar.gz" "$HOME/Library/Mobile Documents/com~apple~CloudDocs/OperatorAI-Backups/"
fi

# Clean old backups (keep last 10)
echo "  → Cleaning old backups..."
ls -t "$BACKUP_DIR"/code-*.tar.gz 2>/dev/null | tail -n +11 | xargs rm -f 2>/dev/null || true

echo ""
echo "✅ Backup complete: $BACKUP_DIR/code-$DATE.tar.gz"
echo "   Size: $(du -h "$BACKUP_DIR/code-$DATE.tar.gz" | cut -f1)"
echo ""
