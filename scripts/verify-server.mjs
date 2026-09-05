import { readdirSync } from 'node:fs';
import { join, extname } from 'node:path';
import { spawnSync } from 'node:child_process';

const serverRoot = join(process.cwd(), 'server');

function walk(dir) {
  const files = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) files.push(...walk(full));
    else if (extname(entry.name) === '.js') files.push(full);
  }
  return files;
}

const files = walk(serverRoot);
let failed = false;

for (const file of files) {
  const result = spawnSync(process.execPath, ['--check', file], { stdio: 'inherit' });
  if (result.status !== 0) failed = true;
}

if (failed) {
  console.error('\nServer syntax verification failed.');
  process.exit(1);
}

console.log(`Server syntax verification passed: ${files.length} JavaScript files checked.`);
