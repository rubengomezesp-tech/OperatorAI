#!/bin/bash
# ═══════════════════════════════════════════════════════════════
# Operator AI — Cleanup Orphan API Routes
# ═══════════════════════════════════════════════════════════════
# 
# Removes API routes that are NOT called from the frontend.
# Verified via grep audit:
#   - /api/create/*    (no frontend calls)
#   - /api/image/imagen (no frontend calls — note: singular)
#   - /api/video/*     (no frontend calls — singular; videos/* is the active one)
#
# Each path is double-checked before deletion.
# ═══════════════════════════════════════════════════════════════

set -e

if [ ! -f "package.json" ]; then
  echo "❌ Run from repo root."
  exit 1
fi

echo "🧹 Cleanup Orphan API Routes"
echo "════════════════════════════"
echo ""

# ── Define orphan candidates ─────────────────────────────────
ORPHAN_DIRS=(
  "src/app/api/create"           # creative duplicate
  "src/app/api/image"            # singular - duplicate of /api/images
  "src/app/api/video"            # singular - duplicate of /api/videos
)

# ── Verify each is actually orphan before deleting ───────────
for dir in "${ORPHAN_DIRS[@]}"; do
  if [ ! -d "$dir" ]; then
    echo "⏭️  $dir — already gone, skipping"
    continue
  fi
  
  # Build the route path (strip "src/app" prefix)
  ROUTE_PATH="${dir#src/app}"
  
  # Search for any frontend file referencing this route
  REFS=$(grep -rn "fetch.*'${ROUTE_PATH}/" src/ 2>/dev/null | grep -v "node_modules" || true)
  
  if [ -n "$REFS" ]; then
    echo "⚠️  $dir — STILL USED, NOT removing:"
    echo "$REFS" | head -5
    echo ""
  else
    echo "✅ $dir — confirmed orphan"
  fi
done

echo ""
echo "📋 Routes that will be removed:"
for dir in "${ORPHAN_DIRS[@]}"; do
  if [ -d "$dir" ]; then
    REFS=$(grep -rn "fetch.*'${dir#src/app}/" src/ 2>/dev/null | grep -v "node_modules" || true)
    if [ -z "$REFS" ]; then
      echo "  - $dir"
      ls "$dir/" 2>/dev/null | sed 's/^/      /'
    fi
  fi
done

echo ""
read -p "🚨 Proceed with deletion? (yes/no): " -r
if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
  echo "Aborted."
  exit 0
fi

# ── DESTRUCTIVE ───────────────────────────────────────────────
echo ""
for dir in "${ORPHAN_DIRS[@]}"; do
  if [ -d "$dir" ]; then
    REFS=$(grep -rn "fetch.*'${dir#src/app}/" src/ 2>/dev/null | grep -v "node_modules" || true)
    if [ -z "$REFS" ]; then
      echo "🗑️  Removing $dir"
      rm -rf "$dir"
    fi
  fi
done

echo ""
echo "✅ Done!"
echo ""
echo "Next steps:"
echo "  1. pnpm typecheck && pnpm build  (verify nothing broke)"
echo "  2. git status                     (review what was removed)"
echo "  3. git add -A && git commit -m 'chore: remove orphan API routes'"
echo "  4. git push"
