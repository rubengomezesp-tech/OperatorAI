#!/usr/bin/env python3
"""
Fix CORRECTO: mantener múltiples aspect ratios en el brief,
pero separarlos al llamar a /api/images/generate
"""

from pathlib import Path
import re

def fix_create_route():
    """Fix create/route.ts para que separe los aspect ratios"""
    filepath = Path("src/app/api/ads/create/route.ts")
    content = filepath.read_text(encoding='utf-8')
    original = content
    
    # 1. En lugar de usar effectiveAspectRatio directo, separarlo por |
    # Buscar: aspectRatio: effectiveAspectRatio (en las llamadas a images/generate)
    
    # Para JSON mode - primera llamada
    old_json_call = "aspectRatio: effectiveAspectRatio,"
    new_json_call = "aspectRatio: (effectiveAspectRatio?.toString().split('|')[0] || '9:16'),"
    if old_json_call in content:
        content = content.replace(old_json_call, new_json_call)
        print("✅ [create/route.ts] Fixed JSON mode - first image-gen call")
    
    # Para JSON mode - llamadas extra (formats loop)
    # Ya usa 'fmt' que viene de body.formats, así que está bien
    
    # Para streaming mode
    old_stream_call = "aspectRatio: effectiveAspectRatio === '16:9' ? '1:1' : (effectiveAspectRatio as '1:1' | '9:16' | '4:5')"
    new_stream_call = "aspectRatio: (() => { const r = (effectiveAspectRatio?.toString() || '9:16').split('|')[0]; return r === '16:9' ? '1:1' : (r as '1:1' | '9:16' | '4:5'); })()"
    if old_stream_call in content:
        content = content.replace(old_stream_call, new_stream_call)
        print("✅ [create/route.ts] Fixed streaming mode - image-gen call")
    
    if content != original:
        filepath.write_text(content, encoding='utf-8')
        print("✅ [create/route.ts] Actualizado correctamente")
    else:
        print("⚠️  [create/route.ts] No se encontraron los patrones esperados")

def revert_brief():
    """Revertir brief/route.ts a su estado original con múltiples ratios"""
    filepath = Path("src/app/api/ads/brief/route.ts")
    content = filepath.read_text(encoding='utf-8')
    original = content
    
    # Volver a poner los múltiples ratios
    old_single = '"aspectRatio": "9:16"'
    new_multiple = '"aspectRatio": "9:16|1:1|4:5|16:9"'
    
    if old_single in content:
        content = content.replace(old_single, new_multiple)
        print("✅ [brief/route.ts] Restaurados múltiples aspect ratios")
    
    if content != original:
        filepath.write_text(content, encoding='utf-8')
        print("✅ [brief/route.ts] Actualizado correctamente")

print("🔧 Aplicando fix CORRECTO para múltiples aspect ratios...")
print()
revert_brief()
print()
fix_create_route()
print()
print("✅ ¡Fix correcto aplicado!")
print("📋 El brief seguirá generando: '9:16|1:1|4:5|16:9'")
print("📋 create/route.ts ahora separa y usa solo el primer ratio para image-gen")
print("📋 Si hay formats[] en el body, usa esos individualmente")
