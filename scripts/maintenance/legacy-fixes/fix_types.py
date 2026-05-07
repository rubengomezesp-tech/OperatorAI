from pathlib import Path

filepath = Path("src/lib/chat/tools.ts")
content = filepath.read_text(encoding='utf-8')

old = "aspectRatios: resolvedFormats,"
new = "aspectRatios: resolvedFormats as ('9:16' | '1:1' | '4:5' | '16:9' | '3:2')[],"

if old in content:
    content = content.replace(old, new)
    print("✅ Tipos arreglados")
else:
    print("❌ No encontrado")

filepath.write_text(content, encoding='utf-8')
