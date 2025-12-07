/**
 * Rich Snippets Tester
 * Tests structured data for rich snippet eligibility
 * 
 * Usage: npm run test:rich-snippets
 */

// @ts-expect-error - Node.js module
import { readFileSync, readdirSync, statSync, writeFileSync } from 'fs';
// @ts-expect-error - Node.js module
import { join, extname } from 'path';
// @ts-expect-error - Node.js module
import { fileURLToPath } from 'url';
// @ts-expect-error - Node.js module
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

interface RichSnippetTest {
  file: string;
  url: string;
  schemas: Array<{
    type: string;
    valid: boolean;
    issues: string[];
    eligible: boolean;
    eligibleTypes: string[];
  }>;
}

/**
 * Find all HTML files recursively
 */
function findHTMLFiles(dir: string, fileList: string[] = []): string[] {
  const files = readdirSync(dir);

  files.forEach((file: string) => {
    const filePath = join(dir, file);
    const stat = statSync(filePath);

    if (stat.isDirectory()) {
      if (!file.startsWith('.') && file !== 'node_modules' && file !== 'dist' && file !== 'build') {
        findHTMLFiles(filePath, fileList);
      }
    } else if (extname(file) === '.html') {
      fileList.push(filePath);
    }
  });

  return fileList;
}

/**
 * Extract structured data from HTML
 */
function extractStructuredData(html: string): Array<{ type: string; data: object }> {
  const schemas: Array<{ type: string; data: object }> = [];
  
  // Match JSON-LD scripts
  const scriptRegex = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let match;
  
  while ((match = scriptRegex.exec(html)) !== null) {
    try {
      const json = JSON.parse(match[1]);
      const type = json['@type'] || 'Unknown';
      schemas.push({ type, data: json });
    } catch {
      // Invalid JSON, skip
    }
  }
  
  return schemas;
}

/**
 * Get URL from file path
 */
function getUrlFromPath(filePath: string): string {
  const relative = filePath.replace(projectRoot, '').replace(/\\/g, '/');
  
  if (relative.includes('/apps/main/')) {
    const path = relative.replace('/apps/main', '');
    if (path === '/index.html' || path === '/') {
      return 'https://www.warmthly.org/';
    }
    return `https://www.warmthly.org${path.replace('/index.html', '/').replace('.html', '.html')}`;
  }
  
  if (relative.includes('/apps/mint/')) {
    const path = relative.replace('/apps/mint', '');
    if (path === '/index.html' || path === '/') {
      return 'https://mint.warmthly.org/';
    }
    return `https://mint.warmthly.org${path.replace('/index.html', '/').replace('.html', '.html')}`;
  }
  
  if (relative.includes('/apps/post/')) {
    const path = relative.replace('/apps/post', '');
    if (path === '/index.html' || path === '/') {
      return 'https://post.warmthly.org/';
    }
    return `https://post.warmthly.org${path.replace('/index.html', '/').replace('.html', '.html')}`;
  }
  
  return relative;
}

/**
 * Check schema eligibility for rich snippets
 */
function checkRichSnippetEligibility(schema: { type: string; data: object }): {
  valid: boolean;
  issues: string[];
  eligible: boolean;
  eligibleTypes: string[];
} {
  const issues: string[] = [];
  const eligibleTypes: string[] = [];
  let valid = true;
  
  const data = schema.data as Record<string, unknown>;
  
  // Check required @context
  if (!data['@context'] || data['@context'] !== 'https://schema.org') {
    issues.push('Missing or invalid @context');
    valid = false;
  }
  
  // Check required @type
  if (!data['@type']) {
    issues.push('Missing @type');
    valid = false;
  }
  
  // Type-specific eligibility checks
  const type = String(data['@type'] || '');
  
  // Rich snippet eligible types
  const richSnippetTypes: Record<string, string[]> = {
    'Organization': ['Organization'],
    'WebSite': ['WebSite', 'SearchAction'],
    'BreadcrumbList': ['BreadcrumbList'],
    'FAQPage': ['FAQPage'],
    'HowTo': ['HowTo'],
    'VideoObject': ['VideoObject'],
    'DonateAction': ['DonateAction'],
    'Article': ['Article', 'BlogPosting', 'NewsArticle'],
    'Product': ['Product'],
    'Review': ['Review', 'AggregateRating'],
    'Event': ['Event'],
    'LocalBusiness': ['LocalBusiness'],
  };
  
  // Check if type is eligible
  Object.entries(richSnippetTypes).forEach(([key, types]) => {
    if (types.includes(type)) {
      eligibleTypes.push(key);
    }
  });
  
  // Type-specific validation
  switch (type) {
    case 'Organization':
      if (!data.name) issues.push('Organization missing name');
      if (!data.url) issues.push('Organization missing url');
      break;
    
    case 'WebSite':
      if (!data.name) issues.push('WebSite missing name');
      if (!data.url) issues.push('WebSite missing url');
      break;
    
    case 'BreadcrumbList':
      if (!data.itemListElement) issues.push('BreadcrumbList missing itemListElement');
      break;
    
    case 'FAQPage':
      if (!data.mainEntity) issues.push('FAQPage missing mainEntity');
      break;
    
    case 'HowTo':
      if (!data.name) issues.push('HowTo missing name');
      if (!data.step) issues.push('HowTo missing step');
      break;
    
    case 'VideoObject':
      if (!data.name) issues.push('VideoObject missing name');
      if (!data.description) issues.push('VideoObject missing description');
      if (!data.thumbnailUrl) issues.push('VideoObject missing thumbnailUrl');
      break;
    
    case 'DonateAction':
      if (!data.target) issues.push('DonateAction missing target');
      break;
  }
  
  const eligible = eligibleTypes.length > 0 && issues.length === 0;
  
  return {
    valid: valid && issues.length === 0,
    issues,
    eligible,
    eligibleTypes,
  };
}

/**
 * Test rich snippets
 */
function testRichSnippets(): void {
  console.log('🔍 Testing rich snippet eligibility...\n');

  const appsDir = join(projectRoot, 'apps');
  const htmlFiles = findHTMLFiles(appsDir);

  console.log(`Found ${htmlFiles.length} HTML files to test\n`);

  const tests: RichSnippetTest[] = [];

  htmlFiles.forEach((file) => {
    const content = readFileSync(file, 'utf-8');
    const relativePath = file.replace(projectRoot, '').replace(/\\/g, '/');
    const url = getUrlFromPath(file);
    
    const schemas = extractStructuredData(content);
    
    if (schemas.length === 0) {
      return; // Skip files without structured data
    }
    
    const schemaTests = schemas.map((schema) => {
      const result = checkRichSnippetEligibility(schema);
      return {
        type: schema.type,
        ...result,
      };
    });
    
    tests.push({
      file: relativePath,
      url,
      schemas: schemaTests,
    });
  });

  // Report results
  const eligiblePages = tests.filter(t => t.schemas.some(s => s.eligible));
  const invalidSchemas = tests.filter(t => t.schemas.some(s => !s.valid));
  
  console.log(`📊 Rich Snippet Test Results:\n`);
  console.log(`   Pages with structured data: ${tests.length}`);
  console.log(`   Pages eligible for rich snippets: ${eligiblePages.length}`);
  console.log(`   Pages with invalid schemas: ${invalidSchemas.length}\n`);

  if (eligiblePages.length > 0) {
    console.log('✅ Pages Eligible for Rich Snippets:\n');
    eligiblePages.forEach((test) => {
      console.log(`   ${test.file}`);
      test.schemas.filter(s => s.eligible).forEach((schema) => {
        console.log(`      ✓ ${schema.type} - Eligible for: ${schema.eligibleTypes.join(', ')}`);
      });
      console.log('');
    });
  }

  if (invalidSchemas.length > 0) {
    console.log('⚠️  Pages with Schema Issues:\n');
    invalidSchemas.forEach((test) => {
      console.log(`   ${test.file}`);
      test.schemas.filter(s => !s.valid || s.issues.length > 0).forEach((schema) => {
        console.log(`      ${schema.type}:`);
        schema.issues.forEach((issue) => {
          console.log(`         - ${issue}`);
        });
      });
      console.log('');
    });
  }

  // Generate report
  let report = `# Rich Snippet Test Report\n\n`;
  report += `Generated: ${new Date().toISOString()}\n\n`;
  report += `## Summary\n\n`;
  report += `- Pages with structured data: ${tests.length}\n`;
  report += `- Pages eligible for rich snippets: ${eligiblePages.length}\n`;
  report += `- Pages with schema issues: ${invalidSchemas.length}\n\n`;
  
  report += `## Eligible Pages\n\n`;
  eligiblePages.forEach((test) => {
    report += `### ${test.file}\n\n`;
    report += `- **URL**: ${test.url}\n`;
    report += `- **Eligible Schemas**:\n`;
    test.schemas.filter(s => s.eligible).forEach((schema) => {
      report += `  - ${schema.type}: ${schema.eligibleTypes.join(', ')}\n`;
    });
    report += `\n`;
  });
  
  if (invalidSchemas.length > 0) {
    report += `## Schema Issues\n\n`;
    invalidSchemas.forEach((test) => {
      report += `### ${test.file}\n\n`;
      test.schemas.filter(s => !s.valid || s.issues.length > 0).forEach((schema) => {
        report += `- **${schema.type}**:\n`;
        schema.issues.forEach((issue) => {
          report += `  - ${issue}\n`;
        });
      });
      report += `\n`;
    });
  }
  
  report += `## Testing\n\n`;
  report += `Test your rich snippets with:\n`;
  report += `- [Google Rich Results Test](https://search.google.com/test/rich-results?url=${encodeURIComponent('https://www.warmthly.org/')})\n`;
  report += `- [Schema.org Validator](https://validator.schema.org/)\n\n`;

  const reportPath = join(projectRoot, 'docs', 'RICH-SNIPPET-TEST-REPORT.md');
  writeFileSync(reportPath, report, 'utf-8');

  console.log(`📄 Full report: ${reportPath}\n`);
  console.log('💡 Next Steps:');
  console.log('   - Test eligible pages with Google Rich Results Test');
  console.log('   - Fix schema issues for invalid pages');
  console.log('   - Monitor rich snippet appearance in search results\n');
}

// Run tests
testRichSnippets();

export { testRichSnippets };

