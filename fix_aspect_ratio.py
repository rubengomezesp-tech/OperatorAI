#!/usr/bin/env python3
"""
Fix aspect ratio bug in OperatorAI
- Changes brief/route.ts to output single aspect ratio
- Adds sanitization in create/route.ts as safety net
"""

import re
import sys
from pathlib import Path

def fix_brief_route(filepath: str) -> bool:
    """Fix the SYSTEM_PROMPT in brief/route.ts to output single aspect ratio"""
    path = Path(filepath)
    if not path.exists():
        print(f"❌ No encontrado: {filepath}")
        return False
    
    content = path.read_text(encoding='utf-8')
    original = content
    
    # Fix 1: Cambiar el ejemplo de aspectRatio en el output JSON
    old_aspect = '"aspectRatio": "9:16|1:1|4:5|16:9"'
    new_aspect = '"aspectRatio": "9:16"'
    
    if old_aspect in content:
        content = content.replace(old_aspect, new_aspect)
        print(f"✅ [brief/route.ts] Changed aspectRatio example: '{old_aspect}' → '{new_aspect}'")
    else:
        print("⚠️  [brief/route.ts] No se encontró la línea exacta del aspectRatio, buscando alternativa...")
        # Fallback: buscar cualquier "aspectRatio" con pipes
        pattern = r'"aspectRatio":\s*"[0-9:]+\|[0-9:]+\|[0-9:]+\|[0-9:]+"'
        match = re.search(pattern, content)
        if match:
            content = content.replace(match.group(), new_aspect)
            print(f"✅ [brief/route.ts] Fixed with regex: {match.group()} → {new_aspect}")
        else:
            print("❌ [brief/route.ts] No se pudo encontrar el aspectRatio para reemplazar")
            return False
    
    # Fix 2: Agregar instrucción para que GPT elija UN solo ratio (si no existe)
    instruction_block = """
Pick the SINGLE best aspectRatio for the chosen preset:
- 9:16 for stories/reels/mobile-first (aggressive-bold, aggressive-sport)
- 1:1 for product demos/social posts (product-demo, clean-conversion)
- 4:5 for luxury/editorial (luxury-minimal, luxury-editorial)
- 16:9 for wide/hero (storytelling-warm, tech-futuristic)"""
    
    if "SINGLE best aspectRatio" not in content:
        # Insertar antes de la sección OUTPUT
        output_marker = "═══════ OUTPUT"
        if output_marker in content:
            content = content.replace(
                output_marker,
                instruction_block + "\n\n" + output_marker
            )
            print("✅ [brief/route.ts] Added aspectRatio selection instructions")
        else:
            print("⚠️  [brief/route.ts] No se encontró marcador OUTPUT, insertando al final del SYSTEM_PROMPT")
            # Insertar antes del último backtick del string
            last_backtick = content.rfind('`;')
            if last_backtick > 0:
                content = content[:last_backtick] + instruction_block + "\n\n" + content[last_backtick:]
                print("✅ [brief/route.ts] Inserted instructions before SYSTEM_PROMPT end")
    
    if content != original:
        path.write_text(content, encoding='utf-8')
        print(f"📝 [brief/route.ts] Archivo actualizado correctamente")
        return True
    else:
        print("ℹ️  [brief/route.ts] No se requirieron cambios")
        return True

def fix_create_route(filepath: str) -> bool:
    """Add aspectRatio sanitization in create/route.ts"""
    path = Path(filepath)
    if not path.exists():
        print(f"❌ No encontrado: {filepath}")
        return False
    
    content = path.read_text(encoding='utf-8')
    original = content
    
    # Buscar la línea donde se usa effectiveAspectRatio sin sanitizar
    # Patrón: aspectRatio: effectiveAspectRatio,
    pattern = r'(aspectRatio:\s*effectiveAspectRatio)(,?\s*)$'
    
    if re.search(pattern, content, re.MULTILINE):
        # Ya existe sanitización?
        if 'safeAspectRatio' in content:
            print("ℹ️  [create/route.ts] Ya tiene sanitización safeAspectRatio")
            return True
        
        # Agregar sanitización antes del primer uso
        sanitize_block = """  // Sanitize aspect ratio (belt and suspenders)
  const safeAspectRatio = (effectiveAspectRatio?.toString() || '9:16').split('|')[0] as '9:16' | '1:1' | '4:5' | '16:9';
"""
        
        # Insertar después de la declaración de effectiveAspectRatio
        effective_line = 'const effectiveAspectRatio'
        if effective_line in content:
            # Encontrar el final de esa línea
            lines = content.split('\n')
            insert_idx = None
            for i, line in enumerate(lines):
                if effective_line in line:
                    insert_idx = i + 1
                    break
            
            if insert_idx:
                lines.insert(insert_idx, sanitize_block.rstrip())
                content = '\n'.join(lines)
                print("✅ [create/route.ts] Added safeAspectRatio sanitization")
        
        # Reemplazar usos de effectiveAspectRatio por safeAspectRatio en las llamadas a API
        # Solo en el contexto de image-gen
        replacements = 0
        # Para JSON mode
        old_json = "aspectRatio: effectiveAspectRatio,"
        new_json = "aspectRatio: safeAspectRatio,"
        if old_json in content:
            content = content.replace(old_json, new_json)
            replacements += 1
        
        # Para el extra formats
        old_extra = "aspectRatio: effectiveAspectRatio as '9:16' | '1:1' | '4:5' | '16:9'"
        new_extra = "aspectRatio: safeAspectRatio"
        if old_extra in content:
            content = content.replace(old_extra, new_extra)
            replacements += 1
        
        if replacements > 0:
            print(f"✅ [create/route.ts] Replaced {replacements} usage(s) of effectiveAspectRatio with safeAspectRatio")
    
    if content != original:
        path.write_text(content, encoding='utf-8')
        print(f"📝 [create/route.ts] Archivo actualizado correctamente")
        return True
    else:
        print("ℹ️  [create/route.ts] No se requirieron cambios (o ya está sanitizado)")
        return True

def main():
    print("🔧 Fixing aspect ratio bug in OperatorAI...")
    print()
    
    base = Path.cwd()
    
    # Fix brief/route.ts
    brief_path = base / "src" / "app" / "api" / "ads" / "brief" / "route.ts"
    if not fix_brief_route(str(brief_path)):
        print("❌ Failed to fix brief/route.ts")
        sys.exit(1)
    
    print()
    
    # Fix create/route.ts (safety net)
    create_path = base / "src" / "app" / "api" / "ads" / "create" / "route.ts"
    if not fix_create_route(str(create_path)):
        print("❌ Failed to fix create/route.ts")
        sys.exit(1)
    
    print()
    print("✅ ¡Todo listo! Los cambios han sido aplicados.")
    print()
    print("📋 Resumen de cambios:")
    print("  1. brief/route.ts: Ahora pide UN solo aspectRatio (9:16 por defecto)")
    print("  2. brief/route.ts: Agregadas instrucciones para elegir ratio según preset")
    print("  3. create/route.ts: Agregada sanitización safeAspectRatio como red de seguridad")
    print()
    print("🚀 Próximos pasos:")
    print("  - Revisa los cambios: git diff")
    print("  - Testea en local: pnpm dev")
    print("  - Si todo OK: git add, commit y push")

if __name__ == "__main__":
    main()
