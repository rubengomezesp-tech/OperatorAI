#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════
# 🌍 SPRINT 5 — CULTURAL ENGINE INTEGRATION
# ═══════════════════════════════════════════════════════════════
# Conecta resolveReference() al detector como fallback inteligente.
# Permite detectar:
#   - "Royal Tenenbaums" → Wes Anderson
#   - "Spirited Away" → Studio Ghibli
#   - "Edward Hopper" → Melancholy
#   - "Jony Ive vibes" → Apple
# ═══════════════════════════════════════════════════════════════

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m'
BOLD='\033[1m'

PROJECT_ROOT="$HOME/Development/OperatorAI"
TARGET_FILE="$PROJECT_ROOT/src/lib/ads/style-dna/detector.ts"
BACKUP_FILE="$TARGET_FILE.bak_cultural_$(date +%s)"

header() {
  echo ""
  echo -e "${BOLD}${PURPLE}═══════════════════════════════════════════════════════════════${NC}"
  echo -e "${BOLD}${PURPLE}  $1${NC}"
  echo -e "${BOLD}${PURPLE}═══════════════════════════════════════════════════════════════${NC}"
}

success() { echo -e "${GREEN}  ✅ $1${NC}"; }
info() { echo -e "${BLUE}  ℹ️  $1${NC}"; }
warn() { echo -e "${YELLOW}  ⚠️  $1${NC}"; }
error() { echo -e "${RED}  ❌ $1${NC}"; }

restore_backup() {
  if [ -f "$BACKUP_FILE" ]; then
    cp "$BACKUP_FILE" "$TARGET_FILE"
    error "ROLLBACK: Restored from backup."
    echo -e "${YELLOW}  Backup at: $BACKUP_FILE${NC}"
  fi
  exit 1
}

# ─── PRE-FLIGHT ─────────────────────────────────────────────
header "🔍 PRE-FLIGHT CHECKS"

if [ ! -f "$TARGET_FILE" ]; then
  error "Target not found: $TARGET_FILE"
  exit 1
fi
success "detector.ts exists"

if [ ! -f "$PROJECT_ROOT/src/lib/ads/style-dna/cultural-reference-engine.ts" ]; then
  error "cultural-reference-engine.ts not found"
  exit 1
fi
success "cultural-reference-engine.ts exists"

# ─── BACKUP ─────────────────────────────────────────────────
header "💾 CREATING BACKUP"
cp "$TARGET_FILE" "$BACKUP_FILE"
success "Backup: $BACKUP_FILE"
ORIGINAL_LINES=$(wc -l < "$TARGET_FILE" | tr -d ' ')
info "detector.ts original: $ORIGINAL_LINES lines"

# ─── CAMBIO 1: ADD IMPORT ───────────────────────────────────
header "✏️  CAMBIO 1/3 — Add resolveReference import"

python3 << 'PYEOF'
target = "/Users/rubenymarina/Development/OperatorAI/src/lib/ads/style-dna/detector.ts"
with open(target, "r") as f:
    content = f.read()

old = "import { findDNAByAlias, getAllDNAs } from './library';"
new = """import { findDNAByAlias, getAllDNAs } from './library';
import { resolveReference } from './cultural-reference-engine';"""

if old not in content:
    print("ERROR: import anchor not found")
    exit(1)
if content.count(old) != 1:
    print(f"ERROR: matches {content.count(old)} times")
    exit(1)

content = content.replace(old, new, 1)
with open(target, "w") as f:
    f.write(content)
print("OK")
PYEOF

if [ $? -ne 0 ]; then
  error "Cambio 1 failed"
  restore_backup
fi

if ! grep -q "from './cultural-reference-engine'" "$TARGET_FILE"; then
  error "Import not applied"
  restore_backup
fi
success "Cambio 1: resolveReference import added"

# ─── CAMBIO 2: SEGMENT-LEVEL FALLBACK ───────────────────────
header "✏️  CAMBIO 2/3 — Add cultural fallback per segment"

python3 << 'PYEOF'
target = "/Users/rubenymarina/Development/OperatorAI/src/lib/ads/style-dna/detector.ts"
with open(target, "r") as f:
    content = f.read()

# Bloque actual: el primer for que itera segments
old = """  for (const segment of segments) {
    const dna = findDNAByAlias(segment);
    if (dna && !seenIds.has(dna.id)) {
      matched.push(dna);
      matchedPhrases.push(segment);
      seenIds.add(dna.id);
    }
  }"""

new = """  for (const segment of segments) {
    // 1) Match directo por alias (rápido, alta precisión)
    let dna = findDNAByAlias(segment);

    // 2) Fallback: cultural reference engine
    //    Resuelve referencias a obras, artistas, marcas, eras.
    //    Ejemplo: "Royal Tenenbaums" → Wes Anderson via references.works
    if (!dna) {
      dna = resolveReference(segment);
    }

    if (dna && !seenIds.has(dna.id)) {
      matched.push(dna);
      matchedPhrases.push(segment);
      seenIds.add(dna.id);
    }
  }"""

if old not in content:
    print("ERROR: segment loop anchor not found")
    exit(1)
if content.count(old) != 1:
    print(f"ERROR: matches {content.count(old)} times")
    exit(1)

content = content.replace(old, new, 1)
with open(target, "w") as f:
    f.write(content)
print("OK")
PYEOF

if [ $? -ne 0 ]; then
  error "Cambio 2 failed"
  restore_backup
fi

if ! grep -q "Cultural reference engine" "$TARGET_FILE" && ! grep -q "cultural reference engine" "$TARGET_FILE"; then
  error "Cultural fallback marker not found"
  restore_backup
fi
success "Cambio 2: segment-level cultural fallback added"

# ─── CAMBIO 3: GLOBAL-LEVEL FALLBACK ────────────────────────
header "✏️  CAMBIO 3/3 — Add cultural fallback to global match"

python3 << 'PYEOF'
target = "/Users/rubenymarina/Development/OperatorAI/src/lib/ads/style-dna/detector.ts"
with open(target, "r") as f:
    content = f.read()

# Bloque actual: el match global cuando segmentación falló
old = """  if (matched.length === 0) {
    const cleaned = preprocessPromptForDNA(prompt);
    const dna = findDNAByAlias(cleaned);
    if (dna) {
      matched.push(dna);
      matchedPhrases.push(cleaned);
    }
  }"""

new = """  if (matched.length === 0) {
    const cleaned = preprocessPromptForDNA(prompt);

    // Match directo por alias en prompt completo
    let dna = findDNAByAlias(cleaned);

    // Fallback: cultural reference engine sobre prompt completo
    if (!dna) {
      dna = resolveReference(cleaned);
    }

    if (dna) {
      matched.push(dna);
      matchedPhrases.push(cleaned);
    }
  }"""

if old not in content:
    print("ERROR: global fallback anchor not found")
    exit(1)
if content.count(old) != 1:
    print(f"ERROR: matches {content.count(old)} times")
    exit(1)

content = content.replace(old, new, 1)
with open(target, "w") as f:
    f.write(content)
print("OK")
PYEOF

if [ $? -ne 0 ]; then
  error "Cambio 3 failed"
  restore_backup
fi
success "Cambio 3: global cultural fallback added"

# ─── VERIFICATIONS ──────────────────────────────────────────
header "🔬 POST-EDIT VERIFICATIONS"

NEW_LINES=$(wc -l < "$TARGET_FILE" | tr -d ' ')
LINES_DELTA=$((NEW_LINES - ORIGINAL_LINES))
info "Lines added: +$LINES_DELTA (was $ORIGINAL_LINES, now $NEW_LINES)"

if [ "$LINES_DELTA" -lt 8 ] || [ "$LINES_DELTA" -gt 25 ]; then
  warn "Unexpected delta: $LINES_DELTA (expected 10-18)"
fi

# Verificar markers nuevos
markers_found=0
for marker in \
  "from './cultural-reference-engine'" \
  "Cultural reference engine" \
  "cultural reference engine sobre prompt completo"
do
  if grep -q "$marker" "$TARGET_FILE"; then
    success "Marker found: $marker"
    markers_found=$((markers_found + 1))
  else
    warn "Marker missing: $marker"
  fi
done

if [ "$markers_found" -lt 2 ]; then
  error "Only $markers_found/3 markers found"
  restore_backup
fi

# ─── TYPESCRIPT CHECK ───────────────────────────────────────
header "🔍 TYPESCRIPT CHECK"

cd "$PROJECT_ROOT"
info "Running tsc --noEmit..."

TS_OUTPUT=$(npx tsc --noEmit --project tsconfig.json 2>&1 || true)
TS_ERRORS=$(echo "$TS_OUTPUT" | grep -E "detector\.ts|style-dna" | head -10 || true)

if [ -z "$TS_ERRORS" ]; then
  success "TypeScript: 0 errors in style-dna/"
else
  error "TS errors:"
  echo "$TS_ERRORS"
  restore_backup
fi

# ─── DIFF ───────────────────────────────────────────────────
header "📋 DIFF SUMMARY"
diff "$BACKUP_FILE" "$TARGET_FILE" | head -50 || true

# ─── SUCCESS ────────────────────────────────────────────────
header "🏆 CULTURAL ENGINE INTEGRATION — SUCCESS"
echo ""
echo -e "${GREEN}${BOLD}  ✅ All 3 changes applied${NC}"
echo -e "${GREEN}${BOLD}  ✅ TypeScript: clean${NC}"
echo -e "${GREEN}${BOLD}  ✅ Backup: $BACKUP_FILE${NC}"
echo ""
echo -e "${YELLOW}${BOLD}  NEXT:${NC}"
echo -e "${YELLOW}    1. Re-run E2E test (should pass 5/5 now):${NC}"
echo -e "${CYAN}       npx tsx scripts/test-style-dna.ts${NC}"
echo -e "${YELLOW}    2. Build + commit + push${NC}"
echo ""
