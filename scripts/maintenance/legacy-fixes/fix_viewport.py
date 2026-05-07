from pathlib import Path

filepath = Path("src/app/layout.tsx")
content = filepath.read_text(encoding='utf-8')

# Fix 1: interactiveWidget + quitar userScalable false
old_viewport = """export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#0a0a0c',
};"""

new_viewport = """export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  interactiveWidget: 'resizes-content',
  themeColor: '#0a0a0c',
};"""

if old_viewport in content:
    content = content.replace(old_viewport, new_viewport)
    print("✅ Viewport: interactiveWidget=resizes-content agregado")
else:
    print("⚠️  No se encontró el bloque exacto")

filepath.write_text(content, encoding='utf-8')
