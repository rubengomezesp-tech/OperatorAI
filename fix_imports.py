from pathlib import Path

filepath = Path("src/app/(app)/admin/admin-dashboard.tsx")
content = filepath.read_text(encoding='utf-8')

# Quitar imports rotos
imports_to_remove = [
    "import { ChatBehaviorPanel } from './chat-behavior/panel';\n",
    "import { PlansPanel } from './plans/panel';\n",
    "import { PushPanel } from './push/panel';\n",
]

for imp in imports_to_remove:
    if imp in content:
        content = content.replace(imp, '')
        print(f"✅ Eliminado: {imp.strip()}")

# Agregar StatsPanel si falta
if "StatsPanel" not in content:
    # Insertar después de LogsPanel
    content = content.replace(
        "import { LogsPanel } from './logs/panel';",
        "import { LogsPanel } from './logs/panel';\nimport { StatsPanel } from './stats/panel';"
    )
    print("✅ Agregado StatsPanel")

filepath.write_text(content, encoding='utf-8')
