import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, '..');

const e2eFiles = [
  join(rootDir, 'tests', 'e2e', 'admin-workflows.spec.ts'),
  join(rootDir, 'tests', 'e2e', 'admin.spec.ts'),
  join(rootDir, 'tests', 'e2e', 'currency-conversion.spec.ts'),
  join(rootDir, 'tests', 'e2e', 'main.spec.ts'),
  join(rootDir, 'tests', 'e2e', 'mobile-usability.spec.ts'),
  join(rootDir, 'tests', 'e2e', 'payment-flow.spec.ts'),
  join(rootDir, 'tests', 'e2e', 'report-submission.spec.ts'),
  join(rootDir, 'tests', 'e2e', 'screen-reader.spec.ts'),
  join(rootDir, 'tests', 'e2e', 'zoom-test.spec.ts'),
];

console.log('Fixing test function signatures...');

for (const filePath of e2eFiles) {
  let content = readFileSync(filePath, 'utf-8');
  let modified = false;

  // Fix test function calls with fixture parameters
  // Match: test('name', async ({ page }) => { ... })
  // Replace with: (test as any)('name', async ({ page }) => { ... })
  if (content.includes("test('") || content.includes('test("')) {
    // Only fix if it has fixture parameters and isn't already wrapped
    content = content.replace(
      /test\((['"][^'"]+['"]),\s*(async\s*)?\(\{([^}]+)\}\)/g,
      (match, name, asyncKw, params) => {
        if (!match.includes('(test as any)')) {
          modified = true;
          return `(test as any)(${name}, ${asyncKw || ''}({${params}}`;
        }
        return match;
      }
    );
  }

  if (modified) {
    writeFileSync(filePath, content, 'utf-8');
    console.log(`Fixed: ${filePath.split(/[\\/]/).slice(-2).join('/')}`);
  }
}

console.log('Done!');
