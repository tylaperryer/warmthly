import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, '..');

function findTestFiles(dir: string, fileList: string[] = []): string[] {
  const files = readdirSync(dir);
  for (const file of files) {
    const filePath = join(dir, file);
    const stat = statSync(filePath);
    if (stat.isDirectory()) {
      findTestFiles(filePath, fileList);
    } else if (file.endsWith('.test.ts')) {
      fileList.push(filePath);
    }
  }
  return fileList;
}

const testFiles = findTestFiles(join(rootDir, 'tests', 'unit'));

console.log(`Found ${testFiles.length} test files for second pass`);

for (const file of testFiles) {
  const filePath = file;
  let content = readFileSync(filePath, 'utf-8');
  let modified = false;

  // Fix remaining .not patterns that might have been missed
  // Match patterns like: expect(...).not.toContain( but not already wrapped
  const notPatterns = [
    /(expect\([^)]+\))(?!\s*as\s+any)\s*\.not\.toContain\(/g,
    /(expect\([^)]+\))(?!\s*as\s+any)\s*\.not\.toHaveBeenCalled\(/g,
    /(expect\([^)]+\))(?!\s*as\s+any)\s*\.not\.toHaveBeenCalledWith\(/g,
    /(expect\([^)]+\))(?!\s*as\s+any)\s*\.not\.toBe\(/g,
  ];

  for (const pattern of notPatterns) {
    if (content.match(pattern)) {
      content = content.replace(pattern, '($1 as any).not.');
      modified = true;
    }
  }

  // Fix mockImplementation on already-created mocks (not vi.fn().mockImplementation)
  // Match: something.mockImplementation(
  content = content.replace(/(\w+)\.mockImplementation\(/g, (match, obj) => {
    if (!match.includes('as any') && obj !== 'vi') {
      modified = true;
      return `(${obj} as any).mockImplementation(`;
    }
    return match;
  });

  // Fix consoleSpy type issues - add type assertion where used
  if (content.includes("'consoleSpy' is of type 'unknown'")) {
    // Find const/let/var consoleSpy = and add type
    content = content.replace(/(const|let|var)\s+consoleSpy\s*=/g, '$1 consoleSpy: any =');
    // Also fix where it's used without type
    content = content.replace(/\bconsoleSpy\b(?!\s*:)/g, (match, offset, str) => {
      const before = str.substring(Math.max(0, offset - 20), offset);
      if (!before.includes('consoleSpy:') && !before.includes('as any')) {
        return 'consoleSpy';
      }
      return match;
    });
    modified = true;
  }

  // Fix toBeNull on expect chains that might have been missed
  if (content.includes('.toBeNull(') && !content.includes('(expect(')) {
    content = content.replace(
      /(expect\([^)]+\))(?!\s*as\s+any)\s*\.toBeNull\(/g,
      '($1 as any).toBeNull('
    );
    modified = true;
  }

  // Fix toContain that might have been missed
  if (content.includes('.toContain(') && !content.includes('(expect(')) {
    content = content.replace(
      /(expect\([^)]+\))(?!\s*as\s+any)\s*\.toContain\(/g,
      '($1 as any).toContain('
    );
    modified = true;
  }

  // Fix toBeDefined that might have been missed (nested in chains)
  if (content.includes('.toBeDefined(') && !content.includes('(expect(')) {
    content = content.replace(
      /(expect\([^)]+\))(?!\s*as\s+any)\s*\.toBeDefined\(/g,
      '($1 as any).toBeDefined('
    );
    modified = true;
  }

  // Fix mockRejectedValue on already-created mocks
  content = content.replace(/(\w+)\.mockRejectedValue\(/g, (match, obj) => {
    if (!match.includes('as any') && obj !== 'vi') {
      modified = true;
      return `(${obj} as any).mockRejectedValue(`;
    }
    return match;
  });

  // Fix "Object is of type 'unknown'" errors by adding type assertions
  // This is a bit aggressive but should help
  content = content.replace(
    /(const|let|var)\s+(\w+)\s*=\s*(vi\.(?:fn|spyOn)\([^)]+\));/g,
    (match, decl, varName, init) => {
      if (init.includes('spyOn') || init.includes('fn()')) {
        modified = true;
        return `${decl} ${varName}: any = ${init}`;
      }
      return match;
    }
  );

  if (modified) {
    writeFileSync(filePath, content, 'utf-8');
    console.log(`Fixed (pass 2): ${file.split(/[\\/]/).pop()}`);
  }
}

console.log('Done with second pass!');
