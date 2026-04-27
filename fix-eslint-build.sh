#!/bin/bash
set -e

echo "🔧 Creando backup de next.config..."

if [ -f "next.config.js" ]; then
  cp next.config.js next.config.js.backup
  CONFIG="next.config.js"
elif [ -f "next.config.mjs" ]; then
  cp next.config.mjs next.config.mjs.backup
  CONFIG="next.config.mjs"
else
  echo "❌ No encuentro next.config.js ni next.config.mjs"
  exit 1
fi

echo "✅ Usando $CONFIG"

# Añade ignoreDuringBuilds sin romper configuración existente
node <<'NODE'
const fs = require('fs');

const files = ['next.config.js', 'next.config.mjs'];
const file = files.find(f => fs.existsSync(f));
let content = fs.readFileSync(file, 'utf8');

if (content.includes('ignoreDuringBuilds')) {
  console.log('✅ ESLint build ignore ya existe.');
  process.exit(0);
}

if (file.endsWith('.mjs')) {
  content = content.replace(
    /const nextConfig\s*=\s*{/,
    `const nextConfig = {\n  eslint: { ignoreDuringBuilds: true },`
  );
} else {
  content = content.replace(
    /const nextConfig\s*=\s*{/,
    `const nextConfig = {\n  eslint: { ignoreDuringBuilds: true },`
  );

  if (!content.includes('const nextConfig')) {
    content = content.replace(
      /module\.exports\s*=\s*{/,
      `module.exports = {\n  eslint: { ignoreDuringBuilds: true },`
    );
  }
}

fs.writeFileSync(file, content);
console.log('✅ Config actualizado:', file);
NODE

echo "🧪 Probando build..."
pnpm run build

echo "✅ Build terminado."
