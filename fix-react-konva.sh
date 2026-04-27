#!/bin/bash
set -e

echo "🔧 Arreglando compatibilidad react-konva con React 18..."

cp package.json package.json.backup
[ -f pnpm-lock.yaml ] && cp pnpm-lock.yaml pnpm-lock.yaml.backup

echo "📦 Instalando react-konva compatible..."
pnpm add react-konva@18 konva@9

echo "🧹 Limpiando build anterior..."
rm -rf .next

echo "🧪 Probando build..."
pnpm run build

echo "✅ Listo. react-konva ya es compatible con React 18."
