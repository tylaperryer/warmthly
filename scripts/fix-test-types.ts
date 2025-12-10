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

console.log(`Found ${testFiles.length} test files to fix`);

for (const file of testFiles) {
  const filePath = file; // file is already an absolute path
  let content = readFileSync(filePath, 'utf-8');
  let modified = false;

  // Fix vi.mock calls
  if (content.includes('vi.mock(') && !content.includes('(vi as any).mock(')) {
    content = content.replace(/vi\.mock\(/g, '(vi as any).mock(');
    modified = true;
  }

  // Fix mockReturnThis - need to be careful with this pattern
  // Match: status: vi.fn().mockReturnThis(),
  content = content.replace(/(\w+):\s*vi\.fn\(\)\.mockReturnThis\(\)/g, (match, prop) => {
    if (!match.includes('(vi.fn() as any)')) {
      modified = true;
      return `${prop}: (vi.fn() as any).mockReturnThis()`;
    }
    return match;
  });

  // Fix mockImplementation
  content = content.replace(
    /vi\.fn\(\)\.mockImplementation\(/g,
    '(vi.fn() as any).mockImplementation('
  );
  if (content.includes('vi.fn().mockImplementation(')) modified = true;

  // Fix mockRejectedValue
  content = content.replace(/\.mockRejectedValue\(/g, (match, offset, str) => {
    const before = str.substring(Math.max(0, offset - 50), offset);
    if (!before.includes('as any')) {
      modified = true;
      return '(vi.fn() as any).mockRejectedValue(';
    }
    return match;
  });

  // Fix timer methods
  const timerMethods = ['useFakeTimers', 'useRealTimers', 'advanceTimersByTime', 'clearAllTimers'];
  for (const method of timerMethods) {
    const regex = new RegExp(`vi\\.${method}\\(`, 'g');
    if (content.match(regex) && !content.includes(`(vi as any).${method}(`)) {
      content = content.replace(regex, `(vi as any).${method}(`);
      modified = true;
    }
  }

  // Fix expect matchers - be careful to not double-wrap
  const matchers = [
    'toBeDefined',
    'toBeNull',
    'toBeTruthy',
    'toBeFalsy',
    'toBeGreaterThan',
    'toBeGreaterThanOrEqual',
    'toBeLessThan',
    'toBeLessThanOrEqual',
    'toContain',
    'toEqual',
    'toBeInstanceOf',
    'toHaveBeenCalledTimes',
  ];

  for (const matcher of matchers) {
    // Match expect(...).matcher( but not (expect(...) as any).matcher(
    const regex = new RegExp(`(expect\\([^)]+\\))(?!\\s*as\\s+any)\\.${matcher}\\(`, 'g');
    if (content.match(regex)) {
      content = content.replace(regex, `($1 as any).${matcher}(`);
      modified = true;
    }
  }

  // Fix expect(...).not.matcher(
  const notMatchers = ['toContain', 'toHaveBeenCalled', 'toHaveBeenCalledWith', 'toBe', 'toThrow'];
  for (const matcher of notMatchers) {
    const regex = new RegExp(`(expect\\([^)]+\\))(?!\\s*as\\s+any)\\.not\\.${matcher}\\(`, 'g');
    if (content.match(regex)) {
      content = content.replace(regex, `($1 as any).not.${matcher}(`);
      modified = true;
    }
  }

  // Fix expect.objectContaining and expect.any
  if (
    content.includes('expect.objectContaining(') &&
    !content.includes('(expect as any).objectContaining(')
  ) {
    content = content.replace(/expect\.objectContaining\(/g, '(expect as any).objectContaining(');
    modified = true;
  }
  if (content.includes('expect.any(') && !content.includes('(expect as any).any(')) {
    content = content.replace(/expect\.any\(/g, '(expect as any).any(');
    modified = true;
  }

  // Fix consoleSpy type issues - find patterns like: const consoleSpy = vi.spyOn(...)
  // and add type assertion
  if (content.includes('consoleSpy') && content.includes("'consoleSpy' is of type 'unknown'")) {
    // This is trickier - we'll need to find the declaration and add type
    // For now, let's just add a type assertion where it's used
    content = content.replace(/(const|let|var)\s+consoleSpy\s*=/g, '$1 consoleSpy: any =');
    modified = true;
  }

  if (modified) {
    writeFileSync(filePath, content, 'utf-8');
    console.log(`Fixed: ${file}`);
  }
}

console.log('Done fixing test files!');
