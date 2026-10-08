import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';

const roots = ['packages', 'examples', 'scripts'];
const extensions = new Set(['.js', '.jsx', '.mjs', '.cjs', '.ts', '.tsx']);

const collectFiles = (directory) => {
  const files = [];
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const filePath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      if (!['dist', 'node_modules', '.next', 'coverage'].includes(entry.name)) {
        files.push(...collectFiles(filePath));
      }
      continue;
    }
    if (extensions.has(path.extname(entry.name))) files.push(filePath);
  }
  return files;
};

const violations = [];
for (const root of roots) {
  for (const filePath of collectFiles(root)) {
    const sourceText = fs.readFileSync(filePath, 'utf8');
    const sourceFile = ts.createSourceFile(
      filePath,
      sourceText,
      ts.ScriptTarget.Latest,
      true,
      ts.ScriptKind.JS,
    );
    const visit = (node) => {
      if (ts.isFunctionDeclaration(node) && node.name) {
        const position = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile));
        violations.push(`${filePath}:${position.line + 1}:${position.character + 1}`);
      }
      ts.forEachChild(node, visit);
    };
    visit(sourceFile);
  }
}

if (violations.length > 0) {
  console.error('Function declarations are not allowed in library source:');
  for (const violation of violations) console.error(`- ${violation}`);
  process.exitCode = 1;
}
