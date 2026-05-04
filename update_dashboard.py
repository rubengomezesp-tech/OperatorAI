from pathlib import Path

filepath = Path("src/app/(app)/admin/admin-dashboard.tsx")
content = filepath.read_text(encoding='utf-8')

# Agregar import de LogsPanel si no existe
if "LogsPanel" not in content:
    # Buscar la línea después del último import de panel
    import_line = "import { LogsPanel } from './logs/panel';"
    
    # Insertar después del import de SystemPanel
    if "import { SystemPanel } from './system/panel';" in content:
        content = content.replace(
            "import { SystemPanel } from './system/panel';",
            "import { SystemPanel } from './system/panel';\nimport { LogsPanel } from './logs/panel';"
        )
        print("✅ Dashboard: Import de LogsPanel agregado")
    
    # Buscar dónde se renderizan los paneles para agregar el case
    if "case 'logs':" not in content:
        # Insertar antes del default o último case
        if "default:" in content:
            content = content.replace(
                "default:",
                "case 'logs': return <LogsPanel />;\n          default:"
            )
            print("✅ Dashboard: Case 'logs' agregado al router")
    
    filepath.write_text(content, encoding='utf-8')
    print("✅ Dashboard actualizado")
else:
    print("ℹ️  LogsPanel ya estaba importado")
