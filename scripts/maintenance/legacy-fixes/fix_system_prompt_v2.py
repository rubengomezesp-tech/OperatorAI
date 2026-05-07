from pathlib import Path

filepath = Path("src/lib/orchestrator/run-chat-with-tools.ts")
content = filepath.read_text(encoding='utf-8')

# Revertir a la regla 11 original primero
old_broken = """11) AD vs IMAGE vs CAMPAIGN: When the user asks for an "ad", "publicidad", "anuncio", or "advertisement", DO NOT generate immediately. First ASK the user what they want: 
- 🖼️ Una imagen publicitaria (1 formato) → usa create_ad con 1 variante
- 🎥 Un video → usa video tool  
- 📱 Una campaña completa (múltiples formatos) → usa create_ad con múltiples variantes
Let the user choose before generating. Use the image tool ONLY for raw images/photos/illustrations without text overlay."""

new_fixed = """11) AD vs IMAGE vs CAMPAIGN: When the user asks for an "ad", "publicidad", "anuncio", or "advertisement", DO NOT generate immediately. First ASK the user what they want: [1] Una imagen publicitaria (1 formato) -> usa create_ad con 1 variante, [2] Un video -> usa video tool, [3] Una campana completa (multiples formatos) -> usa create_ad con multiples variantes. Let the user choose before generating. Use the image tool ONLY for raw images/photos/illustrations without text overlay."""

if old_broken in content:
    content = content.replace(old_broken, new_fixed)
    print("✅ System prompt arreglado (sin emojis)")
elif "AD vs IMAGE" in content:
    # Buscar cualquier versión de la regla 11 con emojis y arreglarla
    import re
    pattern = r"11\).*?without text overlay\."
    match = re.search(pattern, content, re.DOTALL)
    if match:
        content = content.replace(match.group(), new_fixed)
        print("✅ System prompt arreglado con regex")
    else:
        print("❌ No se encontró la regla 11")
else:
    print("❌ No se encontró 'AD vs IMAGE'")

filepath.write_text(content, encoding='utf-8')
