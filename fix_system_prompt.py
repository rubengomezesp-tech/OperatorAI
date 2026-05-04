from pathlib import Path

filepath = Path("src/lib/orchestrator/run-chat-with-tools.ts")
content = filepath.read_text(encoding='utf-8')

# La regla 11 actual — la vamos a reemplazar
old_rule_11 = "11) AD vs IMAGE: When the user asks for an \"ad\", \"publicidad\", \"anuncio\", \"advertisement\", \"creative\", or wants a finished marketing asset with copy/logo/CTA, ALWAYS use the create_ad tool. Use the image tool ONLY for raw images/photos/illustrations without text overlay."

new_rule_11 = """11) AD vs IMAGE vs CAMPAIGN: When the user asks for an "ad", "publicidad", "anuncio", or "advertisement", DO NOT generate immediately. First ASK the user what they want: 
- 🖼️ Una imagen publicitaria (1 formato) → usa create_ad con 1 variante
- 🎥 Un video → usa video tool  
- 📱 Una campaña completa (múltiples formatos) → usa create_ad con múltiples variantes
Let the user choose before generating. Use the image tool ONLY for raw images/photos/illustrations without text overlay."""

if old_rule_11 in content:
    content = content.replace(old_rule_11, new_rule_11)
    print("✅ System prompt: el agente ahora PREGUNTA antes de generar")
else:
    print("❌ No se encontró la regla 11 exacta")
    # Buscar más flexible
    if "AD vs IMAGE" in content:
        print("   Encontrado 'AD vs IMAGE' pero con formato diferente")

filepath.write_text(content, encoding='utf-8')
