from pathlib import Path

filepath = Path("src/app/(app)/admin/admin-dashboard.tsx")
content = filepath.read_text(encoding='utf-8')

# Fix: hacer que stats acepte tanto el formato viejo como el nuevo
old_stats_lines = """            <SC icon={Users} label="Total Users" value={stats.users} color="text-blue-400" />
            <SC icon={MessageSquare} label="Conversations" value={stats.conversations} color="text-emerald-400" />
            <SC icon={ImageIcon} label="Images Generated" value={stats.images} color="text-purple-400" />"""

new_stats_lines = """            <SC icon={Users} label="Total Users" value={stats.users?.total ?? stats.users ?? 0} color="text-blue-400" />
            <SC icon={MessageSquare} label="Conversations" value={stats.conversations ?? stats.usage?.chats ?? 0} color="text-emerald-400" />
            <SC icon={ImageIcon} label="Images Generated" value={stats.images ?? stats.usage?.images ?? 0} color="text-purple-400" />"""

if old_stats_lines in content:
    content = content.replace(old_stats_lines, new_stats_lines)
    print("✅ Dashboard arreglado — compatible con API vieja y nueva")
else:
    print("❌ No se encontraron las líneas exactas")

filepath.write_text(content, encoding='utf-8')
