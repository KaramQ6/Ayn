import { copyFileSync, existsSync, mkdirSync, readdirSync, rmSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const source = path.join(repoRoot, 'client', 'dist');
const target = path.join(repoRoot, 'server', 'public');
const serverRoot = path.join(repoRoot, 'server');

function assertInside(childPath, parentPath) {
  const relative = path.relative(parentPath, childPath);
  if (relative.startsWith('..') || path.isAbsolute(relative)) {
    throw new Error(`Refusing to write outside ${parentPath}: ${childPath}`);
  }
}

if (!existsSync(source)) {
  throw new Error('Client build not found. Run npm --prefix client run build first.');
}

assertInside(target, serverRoot);
rmSync(target, { recursive: true, force: true });

function copyDir(sourceDir, targetDir) {
  mkdirSync(targetDir, { recursive: true });

  for (const entry of readdirSync(sourceDir, { withFileTypes: true })) {
    const sourcePath = path.join(sourceDir, entry.name);
    const targetPath = path.join(targetDir, entry.name);

    if (entry.isDirectory()) {
      copyDir(sourcePath, targetPath);
    } else {
      copyFileSync(sourcePath, targetPath);
    }
  }
}

copyDir(source, target);

console.log(`Copied client build to ${path.relative(repoRoot, target)}`);
