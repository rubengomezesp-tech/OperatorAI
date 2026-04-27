#!/bin/bash
set -e

echo "🔧 Fix Konva canvas for Next.js build..."

CONFIG=""

if [ -f "next.config.js" ]; then
  CONFIG="next.config.js"
elif [ -f "next.config.mjs" ]; then
  CONFIG="next.config.mjs"
else
  echo "❌ No encuentro next.config.js ni next.config.mjs"
  exit 1
fi

cp "$CONFIG" "$CONFIG.backup-konva-canvas"

node <<'NODE'
const fs = require('fs');

const file = fs.existsSync('next.config.js') ? 'next.config.js' : 'next.config.mjs';
let c = fs.readFileSync(file, 'utf8');

if (c.includes("canvas = false") || c.includes("canvas:false")) {
  console.log("✅ El fix de canvas ya existe.");
  process.exit(0);
}

if (c.includes("webpack:")) {
  c = c.replace(
    /webpack:\s*\((config,[^)]*|config)\)\s*=>\s*{/,
    match => `${match}
      config.resolve = config.resolve || {};
      config.resolve.alias = config.resolve.alias || {};
      config.resolve.alias.canvas = false;
`
  );
} else {
  c = c.replace(
    /const nextConfig\s*=\s*{/,
    `const nextConfig = {
  webpack: (config) => {
    config.resolve = config.resolve || {};
    config.resolve.alias = config.resolve.alias || {};
    config.resolve.alias.canvas = false;
    return config;
  },`
  );

  if (!c.includes("webpack:")) {
    c = c.replace(
      /module\.exports\s*=\s*{/,
      `module.exports = {
  webpack: (config) => {
    config.resolve = config.resolve || {};
    config.resolve.alias = config.resolve.alias || {};
    config.resolve.alias.canvas = false;
    return config;
  },`
    );
  }
}

fs.writeFileSync(file, c);
console.log("✅ next config actualizado:", file);
NODE

echo "🧹 Limpiando build..."
rm -rf .next

echo "🧪 Build..."
pnpm run build

echo "✅ DONE"
