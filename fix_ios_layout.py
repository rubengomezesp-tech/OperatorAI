from pathlib import Path

filepath = Path("src/features/chat/components/chat-view.tsx")
content = filepath.read_text(encoding='utf-8')

# Fix 1: Contenedor principal FIJO que nunca se mueve
old_div = '    <div className="flex overflow-hidden relative" style={{ height: "var(--vvh, 100dvh)" }}>'
new_div = '    <div className="flex overflow-hidden fixed inset-0" style={{ top: 0, bottom: "var(--kbh, 0px)" }}>'

if old_div in content:
    content = content.replace(old_div, new_div)
    print("✅ Contenedor principal ahora es FIXED - no se mueve con el teclado")
else:
    print("❌ No se encontró el div principal")

# Fix 2: El composer usa padding-bottom con el keyboard height
old_composer_wrapper = '<div className="flex-shrink-0 sticky-bottom-safe">'
new_composer_wrapper = '<div className="flex-shrink-0" style={{ paddingBottom: "var(--kbh, 0px)" }}>'

if old_composer_wrapper in content:
    content = content.replace(old_composer_wrapper, new_composer_wrapper)
    print("✅ Composer ahora usa padding-bottom dinámico con --kbh")
else:
    print("❌ No se encontró el wrapper del composer")

filepath.write_text(content, encoding='utf-8')
print("✅ chat-view.tsx actualizado")
