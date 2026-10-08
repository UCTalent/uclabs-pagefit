import { existsSync, readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import ts from 'typescript';

const supportedExtensions = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs']);
const fullScan = process.argv.includes('--all');

const runGit = (args) => {
  const result = spawnSync('git', args, { encoding: 'utf8' });
  if (result.status !== 0) {
    throw new Error(result.stderr || `git ${args.join(' ')} failed`);
  }
  return result.stdout;
};

const shouldCheck = (file) => {
  const normalized = file.split(path.sep).join('/');
  return (
    supportedExtensions.has(path.extname(normalized)) &&
    !normalized.endsWith('.d.ts') &&
    !normalized.startsWith('docs/') &&
    !normalized.startsWith('.agents/')
  );
};

const listFiles = () => {
  if (fullScan) {
    return runGit(['ls-files', '-z'])
      .split('\0')
      .filter((file) => existsSync(file) && shouldCheck(file));
  }
  return runGit(['diff', '--cached', '--name-only', '--diff-filter=ACMR', '-z'])
    .split('\0')
    .filter(shouldCheck);
};

const readSource = (file) => {
  return fullScan ? readFileSync(file, 'utf8') : runGit(['show', `:${file}`]);
};

const commentLocations = (source, file) => {
  const sourceFile = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true);
  const positions = new Set();
  const addRanges = (ranges) => {
    for (const range of ranges ?? []) positions.add(range.pos);
  };
  const visit = (node) => {
    addRanges(ts.getLeadingCommentRanges(source, node.getFullStart()));
    addRanges(ts.getTrailingCommentRanges(source, node.getEnd()));
    ts.forEachChild(node, visit);
  };
  visit(sourceFile);
  return [...positions].map((position) => source.slice(0, position).split('\n').length);
};

const violations = [];
for (const file of listFiles()) {
  for (const line of commentLocations(readSource(file), file)) {
    violations.push(`${file}:${line}`);
  }
}

if (violations.length) {
  process.stderr.write(`Comments are prohibited in source files:\n${violations.join('\n')}\n`);
  process.exit(1);
}
