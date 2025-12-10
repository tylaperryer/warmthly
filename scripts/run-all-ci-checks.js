#!/usr/bin/env node
/**
 * Run All CI/CD Checks Locally
 * Simulates the GitHub Actions workflow locally
 */

import { execSync } from 'child_process';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function runCommand(command, description, continueOnError = false) {
  log(`\n${colors.cyan}▶ ${description}${colors.reset}`, colors.bright);
  log(`Running: ${command}`, colors.blue);

  try {
    const output = execSync(command, {
      cwd: projectRoot,
      stdio: 'inherit',
      encoding: 'utf-8',
    });
    log(`✅ ${description} - PASSED`, colors.green);
    return { success: true, output };
  } catch (error) {
    if (continueOnError) {
      log(`⚠️  ${description} - FAILED (continuing)`, colors.yellow);
      return { success: false, output: error.stdout?.toString() || error.message, error };
    } else {
      log(`❌ ${description} - FAILED`, colors.red);
      throw error;
    }
  }
}

const results = {
  core: {},
  build: {},
  e2e: {},
  accessibility: {},
  seo: {},
  security: {},
  lighthouse: {},
};

log('\n' + '='.repeat(80), colors.bright);
log('🚀 Running Full CI/CD Pipeline Locally', colors.bright);
log('='.repeat(80) + '\n', colors.bright);

// Core Checks
log('\n' + '─'.repeat(80), colors.cyan);
log('📋 CORE CHECKS', colors.bright);
log('─'.repeat(80), colors.cyan);

try {
  results.core.typeCheck = runCommand('npm run type-check', 'Type Check');
} catch (_e) {
  results.core.typeCheck = { success: false };
}

try {
  results.core.lint = runCommand('npm run lint', 'Lint', true);
} catch (_e) {
  results.core.lint = { success: false };
}

try {
  results.core.format = runCommand('npm run format:check', 'Format Check', true);
} catch (_e) {
  results.core.format = { success: false };
}

try {
  results.core.i18n = runCommand('npm run validate:i18n', 'i18n Validation', true);
} catch (_e) {
  results.core.i18n = { success: false };
}

try {
  results.core.security = runCommand('npm audit --audit-level=moderate', 'Security Audit', true);
} catch (_e) {
  results.core.security = { success: false };
}

try {
  results.core.tests = runCommand(
    'npm run test:coverage -- --run',
    'Unit Tests with Coverage',
    true
  );
} catch (_e) {
  results.core.tests = { success: false };
}

// Build Checks
log('\n' + '─'.repeat(80), colors.cyan);
log('🏗️  BUILD CHECKS', colors.bright);
log('─'.repeat(80), colors.cyan);

try {
  results.build.build = runCommand('npm run build', 'Build Application', true);
} catch (_e) {
  results.build.build = { success: false };
}

try {
  results.build.bundle = runCommand('npm run analyze:bundle', 'Bundle Size Analysis', true);
} catch (_e) {
  results.build.bundle = { success: false };
}

// E2E Tests
log('\n' + '─'.repeat(80), colors.cyan);
log('🧪 E2E TESTS', colors.bright);
log('─'.repeat(80), colors.cyan);

try {
  results.e2e.tests = runCommand('npm run test:e2e', 'E2E Tests', true);
} catch (_e) {
  results.e2e.tests = { success: false };
}

// Accessibility
log('\n' + '─'.repeat(80), colors.cyan);
log('♿ ACCESSIBILITY', colors.bright);
log('─'.repeat(80), colors.cyan);

try {
  results.accessibility.tests = runCommand('npm run test:a11y', 'Accessibility Tests', true);
} catch (_e) {
  results.accessibility.tests = { success: false };
}

try {
  results.accessibility.audit = runCommand(
    'npm run audit:accessibility',
    'Accessibility Audit',
    true
  );
} catch (_e) {
  results.accessibility.audit = { success: false };
}

// SEO Audit
log('\n' + '─'.repeat(80), colors.cyan);
log('🔍 SEO AUDIT', colors.bright);
log('─'.repeat(80), colors.cyan);

const seoChecks = [
  { cmd: 'npm run generate:sitemap', desc: 'Generate Sitemap' },
  { cmd: 'npm run validate:structured-data', desc: 'Validate Structured Data' },
  { cmd: 'npm run audit:alt-text', desc: 'Audit Alt Text' },
  { cmd: 'npm run generate:seo-report', desc: 'Generate SEO Report' },
  { cmd: 'npm run analyze:link-equity', desc: 'Analyze Link Equity' },
  { cmd: 'npm run validate:semantic-html', desc: 'Validate Semantic HTML' },
  { cmd: 'npm run detect:broken-links', desc: 'Detect Broken Links' },
  { cmd: 'npm run detect:duplicate-content', desc: 'Detect Duplicate Content' },
  { cmd: 'npm run validate:url-structure', desc: 'Validate URL Structure' },
  { cmd: 'npm run optimize:meta-tags', desc: 'Optimize Meta Tags' },
  { cmd: 'npm run validate:sitemap', desc: 'Validate Sitemap' },
  { cmd: 'npm run validate:robots', desc: 'Validate robots.txt' },
  { cmd: 'npm run calculate:seo-score', desc: 'Calculate SEO Score' },
];

for (const check of seoChecks) {
  try {
    results.seo[check.desc] = runCommand(check.cmd, check.desc, true);
  } catch (_e) {
    results.seo[check.desc] = { success: false };
  }
}

// Security
log('\n' + '─'.repeat(80), colors.cyan);
log('🔒 SECURITY CHECKS', colors.bright);
log('─'.repeat(80), colors.cyan);

try {
  results.security.audit = runCommand('npm audit --audit-level=moderate', 'Security Audit', true);
} catch (_e) {
  results.security.audit = { success: false };
}

// Lighthouse
log('\n' + '─'.repeat(80), colors.cyan);
log('⚡ LIGHTHOUSE PERFORMANCE', colors.bright);
log('─'.repeat(80), colors.cyan);

try {
  // Check if lighthouse-ci is available
  execSync('npx lighthouse-ci --version', { stdio: 'ignore' });
  results.lighthouse.audit = runCommand(
    'npm run build && npx lighthouse-ci --config=./.lighthouserc.json',
    'Lighthouse Performance Audit',
    true
  );
} catch (_e) {
  log('⚠️  Lighthouse CI not available - skipping', colors.yellow);
  results.lighthouse.audit = { success: false, skipped: true };
}

// Summary
log('\n' + '='.repeat(80), colors.bright);
log('📊 CI/CD PIPELINE SUMMARY', colors.bright);
log('='.repeat(80) + '\n', colors.bright);

function printSection(name, section, color) {
  log(`\n${name}:`, color);
  let passed = 0;
  let failed = 0;

  for (const [key, value] of Object.entries(section)) {
    if (value.success) {
      log(`  ✅ ${key}`, colors.green);
      passed++;
    } else if (value.skipped) {
      log(`  ⏭️  ${key} (skipped)`, colors.yellow);
    } else {
      log(`  ❌ ${key}`, colors.red);
      failed++;
    }
  }

  return { passed, failed };
}

const coreStats = printSection('Core Checks', results.core, colors.cyan);
const buildStats = printSection('Build Checks', results.build, colors.cyan);
const e2eStats = printSection('E2E Tests', results.e2e, colors.cyan);
const a11yStats = printSection('Accessibility', results.accessibility, colors.cyan);
const seoStats = printSection('SEO Audit', results.seo, colors.cyan);
const securityStats = printSection('Security', results.security, colors.cyan);
const lighthouseStats = printSection('Lighthouse', results.lighthouse, colors.cyan);

const totalPassed =
  coreStats.passed +
  buildStats.passed +
  e2eStats.passed +
  a11yStats.passed +
  seoStats.passed +
  securityStats.passed +
  lighthouseStats.passed;
const totalFailed =
  coreStats.failed +
  buildStats.failed +
  e2eStats.failed +
  a11yStats.failed +
  seoStats.failed +
  securityStats.failed +
  lighthouseStats.failed;

log('\n' + '─'.repeat(80), colors.bright);
log(
  `Total: ${totalPassed} passed, ${totalFailed} failed`,
  totalFailed === 0 ? colors.green : colors.yellow
);
log('─'.repeat(80) + '\n', colors.bright);

if (totalFailed === 0) {
  log('🎉 All checks passed!', colors.green);
  process.exit(0);
} else {
  log('⚠️  Some checks failed. Review the output above for details.', colors.yellow);
  process.exit(1);
}
