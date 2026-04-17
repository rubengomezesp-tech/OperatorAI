#!/usr/bin/env node
/**
 * Operator AI — Auto-translate script
 * ------------------------------------
 * Scans every .tsx page/component, extracts user-facing strings,
 * sends them to OpenAI for Spanish translation, and:
 *   1. Appends new keys to src/lib/i18n.tsx
 *   2. Replaces the hardcoded strings with t('key') calls
 *
 * Usage:
 *   node scripts/auto-translate.mjs --dry-run       # preview, change nothing
 *   node scripts/auto-translate.mjs                 # apply changes
 *   node scripts/auto-translate.mjs --only chat     # only translate a subtree
 *
 * Requires: OPENAI_API_KEY in .env.local
 */
import { readFile, writeFile, readdir, stat, copyFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

// ── config ──
const TARGET_DIRS = ['src/app', 'src/components', 'src/features'];
const IGNORE_DIRS = ['node_modules', '.next', 'dist', 'build'];
const IGNORE_FILES = ['i18n.tsx']; // never touch the dictionary itself
const ONLY = process.argv.includes('--only')
  ? process.argv[process.argv.indexOf('--only') + 1]
  : null;
const DRY_RUN = process.argv.includes('--dry-run');
const I18N_FILE = path.join(ROOT, 'src/lib/i18n.tsx');
const BACKUP_DIR = path.join(ROOT, '.i18n-backup');

// Strings under this length are skipped (single letters, etc.)
const MIN_LEN = 3;
// Strings matching these patterns are skipped (class names, URLs, etc.)
const SKIP_PATTERNS = [
  /^[a-z0-9-]+$/i,             // single words that look like identifiers
  /^\s*$/,                      // whitespace
  /^[#$%&*+/:;<=>@^_`|~-]+$/,  // pure symbols
  /^\d+(\.\d+)?$/,             // numbers
  /^[a-z]+:\/\//i,             // URLs
  /^\/[a-z]/i,                 // paths
  /^[a-z][a-z0-9-]*\s*[a-z0-9-]*$/i,  // className-like
];

// ── env ──
async function loadEnv() {
  const envPath = path.join(ROOT, '.env.local');
  if (!existsSync(envPath)) return;
  const text = await readFile(envPath, 'utf8');
  for (const line of text.split('\n')) {
    const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) {
      let v = m[2];
      if (v.startsWith('"') && v.endsWith('"')) v = v.slice(1, -1);
      process.env[m[1]] = v;
    }
  }
}

// ── file walk ──
async function walk(dir, out = []) {
  const entries = await readdir(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (!IGNORE_DIRS.includes(e.name)) await walk(full, out);
    } else if (e.isFile() && /\.tsx?$/.test(e.name) && !IGNORE_FILES.includes(e.name)) {
      out.push(full);
    }
  }
  return out;
}

// ── string extraction ──
/**
 * Extract user-facing strings from JSX. Looks for:
 *   >Text<
 *   title="Text"    (and placeholder, aria-label, alt)
 *   'Text'  inside small button/span-style components
 *
 * Conservative — skips template literals with ${}, tech-looking strings, etc.
 */
function extractStrings(src) {
  const found = [];
  // 1) JSX text nodes:  >Hello world<
  const jsxRe = />([^<>{}\n]+)</g;
  let m;
  while ((m = jsxRe.exec(src))) {
    const text = m[1].trim();
    if (isTranslatable(text)) {
      found.push({ kind: 'jsx', text, start: m.index + 1, end: m.index + 1 + m[1].length });
    }
  }
  // 2) attribute strings: title="Hello", placeholder="Hello", aria-label="...", alt="..."
  const attrRe = /\b(title|placeholder|aria-label|alt)=(")([^"\n]+)(")/g;
  while ((m = attrRe.exec(src))) {
    const text = m[3].trim();
    if (isTranslatable(text)) {
      const quoteStart = m.index + m[1].length + 1; // after =
      found.push({
        kind: 'attr',
        attr: m[1],
        text,
        start: quoteStart,
        end: quoteStart + 2 + m[3].length, // includes both quotes
      });
    }
  }
  return found;
}

function isTranslatable(s) {
  if (!s || s.length < MIN_LEN || s.length > 300) return false;
  if (s.includes('${') || s.includes('{{')) return false; // template interpolation
  if (!/[a-zA-Z]/.test(s)) return false; // no letters
  if (!/\s/.test(s) && s.length < 6) return false; // too short single word
  for (const re of SKIP_PATTERNS) if (re.test(s)) return false;
  // Skip if looks like a class list (many short words separated by spaces)
  const parts = s.split(/\s+/);
  if (parts.length > 2 && parts.every((p) => /^[a-z0-9-]+$/i.test(p))) return false;
  // Must start with uppercase letter OR contain a space-separated sentence-ish structure
  if (!/[A-Z]/.test(s) && !/\s/.test(s)) return false;
  return true;
}

// ── key generation ──
function slugify(s) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .trim()
    .split(/\s+/)
    .slice(0, 5)
    .join('_');
}

function makeKey(namespace, text, existing) {
  const base = `auto.${namespace}.${slugify(text)}`;
  if (!existing.has(base)) return base;
  let i = 2;
  while (existing.has(`${base}_${i}`)) i++;
  return `${base}_${i}`;
}

function namespaceOf(filePath) {
  const rel = path.relative(ROOT, filePath);
  const parts = rel.split(path.sep);
  // src/app/(app)/dashboard/page.tsx → "dashboard"
  // src/components/chat/message.tsx → "chat"
  const idx = parts.findIndex((p) => p === 'app' || p === 'components' || p === 'features');
  if (idx < 0) return 'misc';
  for (let i = idx + 1; i < parts.length; i++) {
    const p = parts[i];
    if (!p.startsWith('(') && !p.startsWith('[') && p !== 'page.tsx' && p !== 'layout.tsx') {
      return p.replace(/\.tsx?$/, '').replace(/[^a-z0-9]/gi, '_').toLowerCase();
    }
  }
  return 'misc';
}

// ── OpenAI batch translate ──
async function translateBatch(items) {
  if (items.length === 0) return {};
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('OPENAI_API_KEY missing from .env.local');

  const batchSize = 40;
  const result = {};
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    console.log(`    → translating batch ${i / batchSize + 1}/${Math.ceil(items.length / batchSize)}  (${batch.length} strings)`);
    const payload = Object.fromEntries(batch.map((s, idx) => [`s${idx}`, s]));
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        temperature: 0,
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content:
              'You are a professional product-UI translator. Translate English SaaS UI strings into natural, concise, professional Spanish (Spain). Preserve placeholders like {name}, {count}, ${var}. Do NOT translate product names like "Operator AI", "Gmail", "Slack", "Stripe". Return ONLY a JSON object mapping each input key to its Spanish translation.',
          },
          { role: 'user', content: JSON.stringify(payload) },
        ],
      }),
    });
    if (!res.ok) {
      const err = await res.text();
      throw new Error(`OpenAI error: ${res.status} ${err}`);
    }
    const data = await res.json();
    const text = data.choices?.[0]?.message?.content ?? '{}';
    const translations = JSON.parse(text);
    batch.forEach((orig, idx) => {
      const key = `s${idx}`;
      if (translations[key]) result[orig] = translations[key];
    });
  }
  return result;
}

// ── i18n dictionary update ──
async function updateDictionary(newEntries) {
  const src = await readFile(I18N_FILE, 'utf8');
  // Find the closing of `const translations = { … } as const;`
  const marker = /\n\s*\} as const;/;
  const match = src.match(marker);
  if (!match) throw new Error('Could not find translations block in i18n.tsx');
  const insertPos = match.index;

  const lines = [];
  lines.push('\n  // ── auto-generated entries ──');
  for (const [key, { en, es }] of Object.entries(newEntries)) {
    const enEsc = JSON.stringify(en);
    const esEsc = JSON.stringify(es);
    lines.push(`  ${JSON.stringify(key)}: { en: ${enEsc}, es: ${esEsc} },`);
  }
  lines.push('');
  const inject = lines.join('\n');

  const next = src.slice(0, insertPos) + inject + src.slice(insertPos);
  if (!DRY_RUN) await writeFile(I18N_FILE, next, 'utf8');
}

async function readExistingKeys() {
  const src = await readFile(I18N_FILE, 'utf8');
  const keys = new Set();
  const re = /^\s*['"]([a-zA-Z0-9._-]+)['"]\s*:\s*\{\s*en:/gm;
  let m;
  while ((m = re.exec(src))) keys.add(m[1]);
  return keys;
}

// ── apply replacements ──
function applyReplacements(src, items) {
  // sort descending by start so offsets stay valid
  items.sort((a, b) => b.start - a.start);
  let out = src;
  for (const it of items) {
    if (it.kind === 'jsx') {
      const replacement = `{t(${JSON.stringify(it.key)})}`;
      out = out.slice(0, it.start) + replacement + out.slice(it.end);
    } else if (it.kind === 'attr') {
      const replacement = `{t(${JSON.stringify(it.key)})}`;
      out = out.slice(0, it.start) + replacement + out.slice(it.end);
    }
  }
  return out;
}

function ensureI18nImport(src, isClient) {
  if (src.includes("from '@/lib/i18n'")) return src;
  if (!isClient) return src; // server components can't use the hook
  const importLine = `import { useI18n } from '@/lib/i18n';\n`;
  // insert after last import line
  const importRe = /^(import .+;\s*\n)+/m;
  const m = src.match(importRe);
  if (m) {
    return src.slice(0, m.index + m[0].length) + importLine + src.slice(m.index + m[0].length);
  }
  return importLine + src;
}

function ensureTHook(src) {
  // if component has `const { t } = useI18n();` already, skip
  if (/const\s*\{\s*t\s*\}\s*=\s*useI18n\(\)/.test(src)) return src;
  // find first function/const component declaration
  const fnRe = /(export\s+(?:default\s+)?function\s+\w+[^{]*\{|const\s+\w+\s*=\s*\([^)]*\)\s*=>\s*\{|export\s+(?:default\s+)?const\s+\w+\s*=\s*\([^)]*\)\s*=>\s*\{)/;
  const m = src.match(fnRe);
  if (!m) return src;
  const insertPos = m.index + m[0].length;
  return src.slice(0, insertPos) + '\n  const { t } = useI18n();' + src.slice(insertPos);
}

function isClientComponent(src) {
  return /^\s*['"]use client['"]/.test(src);
}

// ── main ──
async function main() {
  await loadEnv();
  console.log(`\nOperator AI — auto-translate ${DRY_RUN ? '(dry-run)' : ''}\n`);

  // 1. gather files
  const files = [];
  for (const d of TARGET_DIRS) {
    const abs = path.join(ROOT, d);
    if (!existsSync(abs)) continue;
    if (ONLY && !d.includes(ONLY)) continue;
    await walk(abs, files);
  }
  const filtered = ONLY ? files.filter((f) => f.includes(ONLY)) : files;
  console.log(`  scanning ${filtered.length} files…\n`);

  // 2. extract all strings
  const existingKeys = await readExistingKeys();
  console.log(`  existing dictionary: ${existingKeys.size} keys\n`);

  const fileHits = [];        // [{ file, src, items: [{kind,text,start,end,key}] }]
  const uniqueStrings = new Map(); // text → key

  for (const file of filtered) {
    const src = await readFile(file, 'utf8');
    const raw = extractStrings(src);
    if (raw.length === 0) continue;

    const ns = namespaceOf(file);
    const items = [];
    for (const r of raw) {
      let key = uniqueStrings.get(r.text);
      if (!key) {
        key = makeKey(ns, r.text, existingKeys);
        existingKeys.add(key);
        uniqueStrings.set(r.text, key);
      }
      items.push({ ...r, key });
    }
    if (items.length) fileHits.push({ file, src, items });
  }

  const allStrings = [...uniqueStrings.keys()];
  console.log(`  found ${allStrings.length} unique translatable strings across ${fileHits.length} files`);

  if (allStrings.length === 0) {
    console.log('\n  nothing to translate — done.\n');
    return;
  }

  // 3. DRY-RUN preview
  if (DRY_RUN) {
    console.log('\n  preview of first 20 strings:');
    allStrings.slice(0, 20).forEach((s, i) => {
      console.log(`    ${i + 1}. "${s.slice(0, 70)}${s.length > 70 ? '…' : ''}"  →  ${uniqueStrings.get(s)}`);
    });
    console.log('\n  files that would change:');
    fileHits.slice(0, 30).forEach((h) => {
      console.log(`    - ${path.relative(ROOT, h.file)}  (${h.items.length} strings)`);
    });
    if (fileHits.length > 30) console.log(`    … and ${fileHits.length - 30} more`);
    console.log('\n  run without --dry-run to apply.\n');
    return;
  }

  // 4. backup
  console.log('\n  creating backup in .i18n-backup/…');
  if (!existsSync(BACKUP_DIR)) await mkdir(BACKUP_DIR, { recursive: true });
  for (const h of fileHits) {
    const rel = path.relative(ROOT, h.file);
    const dest = path.join(BACKUP_DIR, rel);
    await mkdir(path.dirname(dest), { recursive: true });
    await copyFile(h.file, dest);
  }
  await copyFile(I18N_FILE, path.join(BACKUP_DIR, 'i18n.tsx.bak'));

  // 5. translate via OpenAI
  console.log(`\n  translating ${allStrings.length} strings with OpenAI (gpt-4o-mini)…`);
  const translations = await translateBatch(allStrings);

  const newEntries = {};
  for (const [text, key] of uniqueStrings) {
    newEntries[key] = { en: text, es: translations[text] ?? text };
  }

  // 6. update dictionary
  console.log(`\n  updating src/lib/i18n.tsx with ${Object.keys(newEntries).length} new keys`);
  await updateDictionary(newEntries);

  // 7. rewrite files
  console.log(`  rewriting ${fileHits.length} files…`);
  let rewritten = 0;
  let skippedServer = 0;
  for (const h of fileHits) {
    const client = isClientComponent(h.src);
    if (!client) {
      // server component — skip (useI18n is a hook, can't use)
      skippedServer++;
      continue;
    }
    let next = applyReplacements(h.src, h.items);
    next = ensureI18nImport(next, true);
    next = ensureTHook(next);
    await writeFile(h.file, next, 'utf8');
    rewritten++;
  }

  console.log(`\n  ✓ rewrote ${rewritten} client components`);
  if (skippedServer > 0) {
    console.log(`  ⚠ skipped ${skippedServer} server components (useI18n is client-only)`);
    console.log(`    → review those manually and use getTranslations() or pass t as a prop`);
  }
  console.log(`\n  backup saved in .i18n-backup/`);
  console.log(`  to undo:  rm -rf src/{app,components,features} src/lib/i18n.tsx && cp -r .i18n-backup/* src/`);
  console.log(`\n  next:  pnpm run build\n`);
}

main().catch((e) => {
  console.error('\n  ✗ failed:', e.message);
  process.exit(1);
});
