#!/usr/bin/env node
// Bump the project version across all package.json files at once.
//
//   npm run bump -- patch          # 0.1.0 -> 0.1.1
//   npm run bump -- minor          # 0.1.0 -> 0.2.0
//   npm run bump -- major          # 0.1.0 -> 1.0.0
//   npm run bump -- 0.4.2          # set an explicit version
//
// The root package.json is the source of truth; backend/frontend/shared are
// kept in lockstep with it. This only edits files — commit, update the
// CHANGELOG, and tag the release yourself (see RELEASING.md).
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..');

// All package.json files that must share the project version.
const TARGETS = [
  'package.json',
  'backend/package.json',
  'frontend/package.json',
  'shared/package.json'
];

const SEMVER = /^(\d+)\.(\d+)\.(\d+)$/;

function readJson(rel) {
  return JSON.parse(readFileSync(join(repoRoot, rel), 'utf8'));
}

function nextVersion(current, arg) {
  if (SEMVER.test(arg)) return arg;
  const m = current.match(SEMVER);
  if (!m) throw new Error(`Current version "${current}" is not X.Y.Z`);
  let [major, minor, patch] = m.slice(1).map(Number);
  switch (arg) {
    case 'major': return `${major + 1}.0.0`;
    case 'minor': return `${major}.${minor + 1}.0`;
    case 'patch': return `${major}.${minor}.${patch + 1}`;
    default:
      throw new Error(`Invalid argument "${arg}". Use major | minor | patch | X.Y.Z`);
  }
}

const arg = process.argv[2];
if (!arg) {
  console.error('Usage: npm run bump -- <major|minor|patch|X.Y.Z>');
  process.exit(1);
}

const current = readJson('package.json').version;
const next = nextVersion(current, arg);

for (const rel of TARGETS) {
  const pkg = readJson(rel);
  pkg.version = next;
  writeFileSync(join(repoRoot, rel), JSON.stringify(pkg, null, 2) + '\n');
}

console.log(`Version bumped: ${current} -> ${next}`);
console.log('Next steps (see RELEASING.md):');
console.log(`  1. Move CHANGELOG "Unreleased" entries under ## [${next}] - ${new Date().toISOString().slice(0, 10)}`);
console.log('  2. Commit, open a PR, and merge');
console.log(`  3. Tag the release:  git tag -a v${next} -m "v${next}" && git push origin v${next}`);
