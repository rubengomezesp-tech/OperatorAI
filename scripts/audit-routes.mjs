#!/usr/bin/env node
/**
 * Audit all internal routes in the app.
 * - Finds all href="/...", router.push("/..."), redirect("/..."), router.replace("/...")
 * - Compares against existing page.tsx files in src/app/**
 * - Reports broken links (href points to nonexistent page)
 * - Reports orphan pages (page exists but nothing links to it)
 */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const APP_DIR = path.join(ROOT, 'src', 'app');
const SRC_DIR = path.join(ROOT, 'src');

function walk(dir, acc = []) {
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const e of entries) {
      const full = path.join(dir, e.name);
      if (e.isDirectory()) {
        if (e.name === 'node_modules' || e.name === '.next') continue;
        walk(full, acc);
      } else if (e.isFile() && /\.(tsx?|jsx?)$/.test(e.name)) {
        acc.push(full);
      }
    }
  } catch {}
  return acc;
}

// ---- Discover existing pages ----
function discoverPages() {
  const pages = new Set();
  const apiRoutes = new Set();
  const files = walk(APP_DIR);

  for (const file of files) {
    const rel = path.relative(APP_DIR, file);
    const base = path.basename(rel);
    if (base === 'page.tsx' || base === 'page.jsx' || base === 'page.ts' || base === 'page.js') {
      let route = '/' + path.dirname(rel).replace(/\\/g, '/');
      // Remove route group segments: (app), (marketing), (onboarding)
      route = route.replace(/\/\([^)]+\)/g, '');
      // Normalize
      if (route === '/.') route = '/';
      // Replace [param] with :param marker
      route = route.replace(/\[([^\]]+)\]/g, ':$1');
      pages.add(route);
    }
    if (base === 'route.ts' || base === 'route.js') {
      let r = '/' + path.dirname(rel).replace(/\\/g, '/');
      r = r.replace(/\/\([^)]+\)/g, '');
      r = r.replace(/\[([^\]]+)\]/g, ':$1');
      apiRoutes.add(r);
    }
  }
  return { pages, apiRoutes };
}

// ---- Extract links from all source files ----
function extractLinks() {
  const links = []; // {file, line, route}
  const files = walk(SRC_DIR);
  const patterns = [
    /href\s*=\s*["'`](\/[^"'`?#\s]*)["'`]/g,
    /router\.(?:push|replace)\s*\(\s*["'`](\/[^"'`?#\s)]*)["'`]/g,
    /redirect\s*\(\s*["'`](\/[^"'`?#\s)]*)["'`]/g,
    /Link[^>]*href\s*=\s*\{?\s*["'`](\/[^"'`?#\s}]*)["'`]/g,
  ];

  for (const file of files) {
    let content;
    try { content = fs.readFileSync(file, 'utf-8'); } catch { continue; }
    const lines = content.split('\n');
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      for (const pattern of patterns) {
        pattern.lastIndex = 0;
        let m;
        while ((m = pattern.exec(line)) !== null) {
          const route = m[1];
          if (route.startsWith('/api/') || route.startsWith('/_next/')) continue;
          links.push({
            file: path.relative(ROOT, file),
            line: i + 1,
            route,
          });
        }
      }
    }
  }
  return links;
}

function matchesPage(route, pages) {
  if (pages.has(route)) return true;
  // Strip trailing slash
  const trimmed = route.replace(/\/$/, '');
  if (pages.has(trimmed)) return true;
  if (pages.has(trimmed + '/')) return true;
  // Try with :param matching
  for (const p of pages) {
    if (p.includes(':')) {
      const regex = new RegExp('^' + p.replace(/:[^/]+/g, '[^/]+') + '$');
      if (regex.test(route) || regex.test(trimmed)) return true;
    }
  }
  // Special cases (always valid)
  const specialRoutes = ['/login', '/signup', '/logout', '/auth/callback', '/', '/dashboard'];
  if (specialRoutes.includes(route) || specialRoutes.includes(trimmed)) return true;
  return false;
}

// ---- Run audit ----
const { pages } = discoverPages();
const links = extractLinks();

const broken = [];
const used = new Set();

for (const link of links) {
  if (!matchesPage(link.route, pages)) {
    broken.push(link);
  } else {
    used.add(link.route);
    // Also mark trimmed versions
    used.add(link.route.replace(/\/$/, ''));
  }
}

// Pages that exist but are never linked
const orphans = [];
for (const p of pages) {
  if (used.has(p) || used.has(p.replace(/\/$/, ''))) continue;
  // Ignore special pages
  if (['/privacy', '/terms', '/cookies', '/delete-data', '/robots.txt'].includes(p)) continue;
  if (p.startsWith('/auth')) continue;
  orphans.push(p);
}

// ---- Report ----
const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const GREEN = '\x1b[32m';
const CYAN = '\x1b[36m';
const RESET = '\x1b[0m';
const BOLD = '\x1b[1m';

console.log('');
console.log(BOLD + '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━' + RESET);
console.log(BOLD + '  Operator AI — Route Audit' + RESET);
console.log(BOLD + '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━' + RESET);
console.log('');
console.log(`${CYAN}Pages discovered:${RESET} ${pages.size}`);
console.log(`${CYAN}Total links found:${RESET} ${links.length}`);
console.log('');

if (broken.length === 0) {
  console.log(GREEN + '✓ No broken links!' + RESET);
} else {
  console.log(RED + BOLD + '🚨 BROKEN LINKS (' + broken.length + '):' + RESET);
  for (const b of broken) {
    console.log(`  ${RED}${b.route}${RESET} ← ${b.file}:${b.line}`);
  }
}

console.log('');

if (orphans.length === 0) {
  console.log(GREEN + '✓ No orphan pages!' + RESET);
} else {
  console.log(YELLOW + BOLD + '🔗 ORPHAN PAGES (no links point to them):' + RESET);
  for (const o of orphans) {
    console.log(`  ${YELLOW}${o}${RESET}`);
  }
}

console.log('');
console.log(BOLD + '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━' + RESET);
console.log('');

if (broken.length > 0) {
  process.exit(1);
}
