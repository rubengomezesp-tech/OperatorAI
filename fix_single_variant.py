from pathlib import Path

filepath = Path("src/lib/chat/tools.ts")
content = filepath.read_text(encoding='utf-8')

# Cambiar: si no hay formats, solo 1 variante (1:1)
old_formats = """    const plan = await generateCreativePlan({
      userPrompt,
      brandContext,
      logoUrl,
      images,
      aspectRatios: formats ? parseAspectRatios(formats) : undefined,
      presetOverride,
    });"""

new_formats = """    // Si el usuario no especifica formatos, generamos 1 sola variante (1:1)
    // Solo si pide "campaña" o varios formatos, generamos múltiples
    const resolvedFormats = formats && formats.length > 0 
      ? parseAspectRatios(formats) 
      : ['1:1']; // default: una sola imagen cuadrada
    
    const plan = await generateCreativePlan({
      userPrompt,
      brandContext,
      logoUrl,
      images,
      aspectRatios: resolvedFormats,
      presetOverride,
    });"""

if old_formats in content:
    content = content.replace(old_formats, new_formats)
    print("✅ execCreateAd: 1 variante por defecto, múltiples solo si se pide")
else:
    print("❌ No se encontró el bloque de formats")
    # Buscar alternativa
    if "aspectRatios: formats ? parseAspectRatios(formats) : undefined" in content:
        print("   Encontrado con formato diferente, aplicando fix alternativo")
        content = content.replace(
            "aspectRatios: formats ? parseAspectRatios(formats) : undefined",
            "aspectRatios: formats && formats.length > 0 ? parseAspectRatios(formats) : ['1:1']"
        )
        print("✅ Fix alternativo aplicado")

filepath.write_text(content, encoding='utf-8')
