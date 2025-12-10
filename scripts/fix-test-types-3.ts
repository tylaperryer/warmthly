import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, '..');

const testFiles = [
  join(rootDir, 'tests', 'unit', 'request-timeout.test.ts'),
  join(rootDir, 'tests', 'unit', 'rate-limit.test.ts'),
  join(rootDir, 'tests', 'unit', 'inbound-email.test.ts'),
  join(rootDir, 'tests', 'unit', 'warmthly-i18n.test.ts'),
  join(rootDir, 'tests', 'unit', 'warmthly-head.test.ts'),
  join(rootDir, 'tests', 'unit', 'convert-currency.test.ts'),
];

console.log(`Fixing ${testFiles.length} test files`);

for (const filePath of testFiles) {
  let content = readFileSync(filePath, 'utf-8');
  let modified = false;

  // Fix function parameter type mismatches - add as any to function parameters
  // Pattern: vi.fn((req: MockRequest, res: MockResponse) => ...)
  content = content.replace(
    /vi\.fn\(\(req:\s*MockRequest,\s*res:\s*MockResponse\)/g,
    'vi.fn((req: MockRequest, res: MockResponse) as any'
  );

  // Pattern: vi.fn((_req: unknown, res: ...) => ...)
  content = content.replace(/vi\.fn\(\(_req:\s*unknown,\s*res:/g, 'vi.fn((_req: unknown, res:');

  // Fix handler function type mismatches
  content = content.replace(
    /const\s+handler\s*=\s*vi\.fn\(\(req:\s*MockRequest,\s*res:\s*MockResponse\)/g,
    'const handler = (vi.fn((req: MockRequest, res: MockResponse)'
  );

  // Fix wrapped handler assignments
  content = content.replace(/const\s+wrapped\s*=\s*withTimeout\(handler,\s*\d+\);/g, match => {
    if (!match.includes('as any')) {
      modified = true;
      return match.replace('withTimeout(handler,', 'withTimeout(handler as any,');
    }
    return match;
  });

  // Fix Request type mismatches - add url and headers or use as any
  // Pattern: await convertCurrency(req, res); where req is missing url/headers
  content = content.replace(/(await\s+\w+\(req\s*as\s*any,\s*res\))/g, '$1');

  // Fix mock request objects missing url/headers
  content = content.replace(
    /(const\s+req\s*=\s*\{[^}]*method:\s*['"]\w+['"][^}]*query:[^}]*\}\s*;)/gs,
    match => {
      if (!match.includes('url:') && !match.includes('as any')) {
        modified = true;
        return match.replace('};', ", url: '', headers: {} } as any;");
      }
      return match;
    }
  );

  // Fix on() method type mismatches
  content = content.replace(
    /\.on\(\(event:\s*string,\s*callback:/g,
    '.on((event: string, callback:'
  );
  content = content.replace(
    /\.on\(\(event:\s*string,\s*callback:\s*\(\)\s*=>\s*void\)/g,
    '.on((event: string, callback: () => void) as any'
  );
  content = content.replace(
    /\.on\(\(event:\s*string,\s*callback:\s*\(data\?:\s*Buffer\)\s*=>\s*void\)/g,
    '.on((event: string, callback: (data?: Buffer) => void) as any'
  );

  // Fix warmthly-i18n vi.fn parameter type
  content = content.replace(
    /t:\s*vi\.fn\(\(key:\s*string\)\s*=>\s*key\)/g,
    't: (vi.fn((key: string) => key) as any)'
  );

  // Fix pipeline property access
  content = content.replace(/(\w+)\.pipeline\(/g, (match, obj) => {
    if (!match.includes('as any')) {
      modified = true;
      return `(${obj} as any).pipeline(`;
    }
    return match;
  });

  // Fix mockPipeline type
  content = content.replace(
    /const\s+mockPipeline\s*=\s*(\w+)\.pipeline\(\);/g,
    'const mockPipeline: any = $1.pipeline();'
  );

  // Fix warmthly-head cleanup import
  if (content.includes("import { cleanup } from '@testing-library/dom'")) {
    content = content.replace(
      /import\s+\{\s*cleanup\s*\}\s*from\s*['"]@testing-library\/dom['"];?/g,
      '// cleanup not needed in this test'
    );
    modified = true;
  }

  if (modified || content !== readFileSync(filePath, 'utf-8')) {
    writeFileSync(filePath, content, 'utf-8');
    console.log(`Fixed: ${filePath.split(/[\\/]/).pop()}`);
  }
}

console.log('Done!');
