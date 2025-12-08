/**
 * Secrets Check Script
 * Validates secrets configuration and checks for potential leaks
 * Run: npm run check:secrets
 */

import {
  validateRequiredSecrets,
  getSecretsStatus,
} from '../api/utils/secrets-management.js';

/**
 * Main check function
 */
function main(): void {
  console.log('🔒 Checking secrets configuration...\n');

  // Check environment variables
  const validation = validateRequiredSecrets();
  const status = getSecretsStatus();

  console.log(`📊 Secrets Status:`);
  console.log(`   Configured: ${status.configured}/${status.total}`);
  console.log(`   Missing: ${status.missing}`);

  if (status.missing > 0) {
    console.log(`\n❌ Missing required secrets:`);
    validation.missing.forEach((name: string) => {
      console.log(`   - ${name}`);
    });
  }

  if (status.warnings.length > 0) {
    console.log(`\n⚠️  Warnings:`);
    status.warnings.forEach((warning: string) => {
      console.log(`   - ${warning}`);
    });
  }

  if (validation.valid && status.warnings.length === 0) {
    console.log(`\n✅ All secrets are properly configured!`);
  }

  // Check for secrets in code (basic check)
  console.log(`\n🔍 Checking for potential secrets in code...`);
  // In production, would scan all code files
  console.log(`   (Code scanning not implemented - use git-secrets or similar tool)`);
  console.log(`   Recommendation: Install git-secrets to prevent accidental commits`);
}

main();
