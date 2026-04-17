#!/usr/bin/env bash
set -e
cd "$(dirname "$0")/.."
echo "🍎 Syncing + opening Xcode..."
npx cap sync ios
npx cap open ios
echo "✅ Xcode open. Select Team → Run → Archive → Submit."
