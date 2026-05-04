from pathlib import Path

filepath = Path("src/app/(app)/admin/admin-sidebar.tsx")
content = filepath.read_text(encoding='utf-8')

# Quitar comingSoon de Error Logs
old = "{ id: 'logs', label: 'Error Logs', icon: Database, comingSoon: true },"
new = "{ id: 'logs', label: 'Error Logs', icon: Database },"

if old in content:
    content = content.replace(old, new)
    print("✅ Sidebar: Error Logs ahora está activo")
else:
    print("⚠️  No se encontró la línea exacta, buscando...")
    if "Error Logs" in content:
        print("   Encontrado 'Error Logs' en sidebar pero con formato diferente")
    else:
        print("   'Error Logs' no encontrado en sidebar")

filepath.write_text(content, encoding='utf-8')
print("✅ Sidebar actualizado")
