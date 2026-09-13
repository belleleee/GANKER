import { existsSync, readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const pages = [
  'index.html',
  'game.html',
  'coin-game/index.html',
  'investment-room/index.html',
  'line-art-cafe/index.html',
  'tea-hut/index.html',
  'jourmal.html'
];
const errors = [];
const checkedCss = new Set();

function checkReference(owner, reference) {
  if (/^(?:https?:|data:|#)/i.test(reference)) return null;
  const target = path.resolve(path.dirname(owner), reference.split(/[?#]/, 1)[0]);
  if (!existsSync(target)) errors.push(`${path.relative(root, owner)}: missing ${reference}`);
  return target;
}

function checkCss(file) {
  if (!existsSync(file) || checkedCss.has(file)) return;
  checkedCss.add(file);
  const css = readFileSync(file, 'utf8');
  for (const match of css.matchAll(/@import\s+(?:url\()?\s*["']([^"']+)["']/g)) {
    const target = checkReference(file, match[1]);
    if (target) checkCss(target);
  }
}

for (const page of pages) {
  const file = path.join(root, page);
  if (!existsSync(file)) {
    errors.push(`${page}: missing page`);
    continue;
  }
  const html = readFileSync(file, 'utf8');
  const scripts = [...html.matchAll(/<script\b[^>]*\bsrc\s*=\s*["']([^"']+)["']/gi)]
    .map(match => match[1]);
  for (const reference of scripts) checkReference(file, reference);
  for (const match of html.matchAll(/<link\b[^>]*\brel\s*=\s*["']stylesheet["'][^>]*\bhref\s*=\s*["']([^"']+)["']/gi)) {
    const target = checkReference(file, match[1]);
    if (target) checkCss(target);
  }
}

function checkScripts(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) checkScripts(file);
    else if (entry.name.endsWith('.js')) {
      try {
        execFileSync(process.execPath, ['--check', file], { stdio: 'pipe' });
      } catch (error) {
        errors.push(`${path.relative(root, file)}: ${String(error.stderr || error.message).trim()}`);
      }
    }
  }
}

for (const dir of ['js', 'coin-game/js', 'investment-room/js', 'line-art-cafe/js', 'tea-hut/js']) {
  checkScripts(path.join(root, dir));
}

if (errors.length) {
  console.error(errors.join('\n'));
  process.exitCode = 1;
} else {
  console.log(`Structure OK: ${pages.length} pages, ${checkedCss.size} stylesheets, all JS parses`);
}
