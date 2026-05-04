from pathlib import Path

filepath = Path("src/lib/orchestrator/run-chat-with-tools.ts")
content = filepath.read_text(encoding='utf-8')

# CAMBIO 1: Eliminar la detección forzada de create_ad
old_keywords = r"  const _adKeywords = /\b(publicidad|anuncio|ad|advertisement|advert|creative|marketing\s+piece|ads)\b/i;"
new_keywords = r"  // Ad detection desactivada — el modelo decide libremente qué tool usar"
content = content.replace(old_keywords, new_keywords)
print("✅ Cambio 1: Detección forzada ELIMINADA")

# CAMBIO 2: Eliminar _isAdRequest y forzar siempre 'auto'
old_force = """  const _isAdRequest = _adKeywords.test(_lastUserText);

  let adAlreadyCreated = false;"""
new_force = """  // El modelo decide libremente — no forzamos create_ad
  let adAlreadyCreated = false;"""
content = content.replace(old_force, new_force)
print("✅ Cambio 2: _isAdRequest ELIMINADO")

# CAMBIO 3: Quitar el tool_choice forzado, siempre 'auto'
old_tool_choice = """    const _toolChoice: Anthropic.MessageCreateParams.ToolChoiceTool | Anthropic.MessageCreateParams.ToolChoiceAuto =
      (loop === 0 && _isAdRequest)
        ? { type: 'tool', name: 'create_ad' }
        : { type: 'auto' };

    if (loop === 0) {
      console.log('[chat:anthropic] tool_choice:', _isAdRequest ? 'create_ad (forced)' : 'auto', '| msg:', _lastUserText.slice(0, 80));
    }"""

new_tool_choice = """    // Siempre 'auto' — el modelo elige la mejor tool según el contexto
    const _toolChoice: Anthropic.MessageCreateParams.ToolChoiceAuto = { type: 'auto' };

    if (loop === 0) {
      console.log('[chat:anthropic] tool_choice: auto | msg:', _lastUserText.slice(0, 80));
    }"""

content = content.replace(old_tool_choice, new_tool_choice)
print("✅ Cambio 3: tool_choice SIEMPRE 'auto'")

filepath.write_text(content, encoding='utf-8')
print("✅ run-chat-with-tools.ts actualizado")
