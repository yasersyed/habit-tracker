#!/usr/bin/env node
// Verify every package.json shares the same, valid SemVer version.
// Run locally or in CI to catch drift:  npm run check:version
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const TARGETS = [
  'package.json',
  'backend/package.json',
  'frontend/package.json',
  'shared/package.json'
];
const SEMVER = /^(\d+)\.(\d+)\.(\d+)$/;

const versions = TARGETS.map((rel) => {
  const { version } = JSON.parse(readFileSync(join(repoRoot, rel), 'utf8'));
  return { rel, version };
});

const root = versions[0].version;
const problems = [];

if (!SEMVER.test(root)) {
  problems.push(`root version "${root}" is not valid SemVer (X.Y.Z)`);
}
for (const { rel, version } of versions) {
  if (version !== root) {
    problems.push(`${rel} is ${version}, expected ${root}`);
  }
}

if (problems.length) {
  console.error('Version check FAILED:');
  for (const p of problems) console.error(`  - ${p}`);
  console.error('\nRun `npm run bump -- <version>` to sync all package.json files.');
  process.exit(1);
}

console.log(`Version check OK — all packages at ${root}`);
