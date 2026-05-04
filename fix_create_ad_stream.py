from pathlib import Path

filepath = Path("src/lib/chat/tools.ts")
content = filepath.read_text(encoding='utf-8')

# Fix 1: Capturar evento 'result' (NO 'complete')
old_complete = "if (currentEvent === 'complete' && parsed.results)"
new_complete = "if (currentEvent === 'result' && parsed.url)"

if old_complete in content:
    content = content.replace(old_complete, new_complete)
    print("✅ Fixed event name: 'complete' → 'result'")
    print("✅ Fixed field: 'results' → 'url'")

# Fix 2: Cambiar cómo se extrae la URL
old_urls = """if (currentEvent === 'result' && parsed.url) {
              finalUrls = (parsed.results as Array<{ url?: string }>)
                .filter((r) => r.url)
                .map((r) => r.url as string);"""
new_urls = """if (currentEvent === 'result' && parsed.url) {
              finalUrls = [parsed.url as string];"""

if old_urls in content:
    content = content.replace(old_urls, new_urls)
    print("✅ Fixed URL extraction")

filepath.write_text(content, encoding='utf-8')
print("✅ tools.ts actualizado")
