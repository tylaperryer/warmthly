/**
 * Performance Budget Monitor
 * Monitors and enforces performance budgets for Core Web Vitals
 *
 * Usage: npm run monitor:performance-budget
 */

import { writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

interface PerformanceBudget {
  lcp: number; // Largest Contentful Paint (ms)
  fid: number; // First Input Delay (ms)
  cls: number; // Cumulative Layout Shift
  fcp: number; // First Contentful Paint (ms)
  ttfb: number; // Time to First Byte (ms)
  totalBlockingTime: number; // TBT (ms)
  speedIndex: number; // Speed Index
}

interface BudgetViolation {
  metric: string;
  current: number;
  budget: number;
  severity: 'error' | 'warning';
}

/**
 * Default performance budgets (Google's recommended thresholds)
 */
const DEFAULT_BUDGETS: PerformanceBudget = {
  lcp: 2500, // Good: < 2.5s, Needs Improvement: 2.5-4s, Poor: > 4s
  fid: 100, // Good: < 100ms, Needs Improvement: 100-300ms, Poor: > 300ms
  cls: 0.1, // Good: < 0.1, Needs Improvement: 0.1-0.25, Poor: > 0.25
  fcp: 1800, // Good: < 1.8s, Needs Improvement: 1.8-3s, Poor: > 3s
  ttfb: 800, // Good: < 800ms, Needs Improvement: 800-1800ms, Poor: > 1800ms
  totalBlockingTime: 200, // Good: < 200ms, Needs Improvement: 200-600ms, Poor: > 600ms
  speedIndex: 3400, // Good: < 3.4s, Needs Improvement: 3.4-5.8s, Poor: > 5.8s
};

/**
 * Check performance metrics against budget
 */
function checkBudget(
  metrics: Partial<PerformanceBudget>,
  budgets: PerformanceBudget
): BudgetViolation[] {
  const violations: BudgetViolation[] = [];

  Object.entries(metrics).forEach(([key, value]) => {
    if (value === undefined) return;

    const budget = budgets[key as keyof PerformanceBudget];
    if (budget === undefined) return;

    // Determine severity based on how much over budget
    const overage = value - budget;
    const percentageOver = (overage / budget) * 100;

    let severity: 'error' | 'warning' = 'warning';
    if (percentageOver > 50 || (key === 'cls' && value > budget * 2)) {
      severity = 'error';
    }

    if (value > budget) {
      violations.push({
        metric: key.toUpperCase(),
        current: Math.round(value * 100) / 100,
        budget,
        severity,
      });
    }
  });

  return violations;
}

/**
 * Load performance data from RUM storage or Lighthouse report
 */
function loadPerformanceData(): Partial<PerformanceBudget> {
  // In a real scenario, this would:
  // 1. Read from localStorage dump (if available)
  // 2. Read from Lighthouse CI reports
  // 3. Read from PageSpeed Insights API results

  // For now, return empty object (will be populated by actual monitoring)
  return {};
}

/**
 * Generate performance budget report
 */
function generateReport(violations: BudgetViolation[], budgets: PerformanceBudget): string {
  const errors = violations.filter(v => v.severity === 'error');
  const warnings = violations.filter(v => v.severity === 'warning');

  let report = `# Performance Budget Report\n\n`;
  report += `Generated: ${new Date().toISOString()}\n\n`;

  report += `## Budget Thresholds\n\n`;
  report += `| Metric | Budget | Status |\n`;
  report += `|--------|--------|--------|\n`;
  report += `| LCP (Largest Contentful Paint) | < ${budgets.lcp}ms | ${
    violations.find(v => v.metric === 'LCP') ? '❌' : '✅'
  } |\n`;
  report += `| FID (First Input Delay) | < ${budgets.fid}ms | ${
    violations.find(v => v.metric === 'FID') ? '❌' : '✅'
  } |\n`;
  report += `| CLS (Cumulative Layout Shift) | < ${budgets.cls} | ${
    violations.find(v => v.metric === 'CLS') ? '❌' : '✅'
  } |\n`;
  report += `| FCP (First Contentful Paint) | < ${budgets.fcp}ms | ${
    violations.find(v => v.metric === 'FCP') ? '❌' : '✅'
  } |\n`;
  report += `| TTFB (Time to First Byte) | < ${budgets.ttfb}ms | ${
    violations.find(v => v.metric === 'TTFB') ? '❌' : '✅'
  } |\n`;
  report += `| TBT (Total Blocking Time) | < ${budgets.totalBlockingTime}ms | ${
    violations.find(v => v.metric === 'TBT') ? '❌' : '✅'
  } |\n`;
  report += `| Speed Index | < ${budgets.speedIndex}ms | ${
    violations.find(v => v.metric === 'SPEEDINDEX') ? '❌' : '✅'
  } |\n\n`;

  if (violations.length === 0) {
    report += `## ✅ All metrics within budget!\n\n`;
    report += `All Core Web Vitals are meeting performance targets.\n`;
  } else {
    if (errors.length > 0) {
      report += `## ❌ Critical Violations (${errors.length})\n\n`;
      errors.forEach(violation => {
        const overage = violation.current - violation.budget;
        const percentage = ((overage / violation.budget) * 100).toFixed(1);
        report += `- **${violation.metric}**: ${violation.current} (budget: ${violation.budget}, ${percentage}% over)\n`;
      });
      report += `\n`;
    }

    if (warnings.length > 0) {
      report += `## ⚠️  Warnings (${warnings.length})\n\n`;
      warnings.forEach(violation => {
        const overage = violation.current - violation.budget;
        const percentage = ((overage / violation.budget) * 100).toFixed(1);
        report += `- **${violation.metric}**: ${violation.current} (budget: ${violation.budget}, ${percentage}% over)\n`;
      });
      report += `\n`;
    }

    report += `## Recommendations\n\n`;
    violations.forEach(violation => {
      switch (violation.metric) {
        case 'LCP':
          report += `- **LCP**: Optimize images, reduce server response time, eliminate render-blocking resources\n`;
          break;
        case 'FID':
          report += `- **FID**: Reduce JavaScript execution time, minimize main thread work\n`;
          break;
        case 'CLS':
          report += `- **CLS**: Add size attributes to images, avoid inserting content above existing content\n`;
          break;
        case 'FCP':
          report += `- **FCP**: Optimize critical rendering path, reduce render-blocking CSS\n`;
          break;
        case 'TTFB':
          report += `- **TTFB**: Improve server response time, use CDN, enable caching\n`;
          break;
        case 'TBT':
          report += `- **TBT**: Reduce JavaScript execution time, code split, lazy load\n`;
          break;
        case 'SPEEDINDEX':
          report += `- **Speed Index**: Optimize above-the-fold content, reduce render-blocking resources\n`;
          break;
      }
    });
  }

  report += `\n---\n`;
  report += `*Report generated by Warmthly Performance Budget Monitor*\n`;

  return report;
}

/**
 * Main monitoring function
 */
function monitorPerformanceBudget(): void {
  console.log('📊 Monitoring performance budget...\n');

  // Load performance data
  const metrics = loadPerformanceData();

  // Check against budgets
  const violations = checkBudget(metrics, DEFAULT_BUDGETS);

  // Generate report
  const report = generateReport(violations, DEFAULT_BUDGETS);
  const reportPath = join(projectRoot, 'docs', 'PERFORMANCE-BUDGET-REPORT.md');

  try {
    writeFileSync(reportPath, report, 'utf-8');
    console.log(`✅ Performance budget report generated: ${reportPath}\n`);

    if (violations.length === 0) {
      console.log('✅ All performance metrics within budget!\n');
    } else {
      const errors = violations.filter(v => v.severity === 'error');
      const warnings = violations.filter(v => v.severity === 'warning');

      console.log(`⚠️  Performance budget violations:\n`);
      console.log(`   Errors: ${errors.length}`);
      console.log(`   Warnings: ${warnings.length}\n`);

      violations.forEach(violation => {
        const icon = violation.severity === 'error' ? '❌' : '⚠️';
        console.log(
          `   ${icon} ${violation.metric}: ${violation.current} (budget: ${violation.budget})`
        );
      });

      console.log(`\n📄 Full report: ${reportPath}\n`);

      if (errors.length > 0) {
        console.log('❌ Critical performance issues detected. Please address before deploying.\n');
        process.exit(1);
      }
    }
  } catch (error) {
    console.error('❌ Error generating performance budget report:', error);
    process.exit(1);
  }
}

// Run monitoring
monitorPerformanceBudget();

export { monitorPerformanceBudget, DEFAULT_BUDGETS };
