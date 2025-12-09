/**
 * Secrets Check Script
 * Validates secrets configuration and checks for potential leaks
 * Run: npm run check:secrets
 */

/**
 * Main check function
 */
async function main(): Promise<void> {
  console.log('🔒 Checking secrets configuration...\n');

  try {
    // Dynamic import to handle missing module gracefully
    const secretsModule = await import('../api/utils/secrets-management.js');
    const { validateRequiredSecrets, getSecretsStatus } = secretsModule;

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
  } catch (error) {
    if (error instanceof Error && 'code' in error && error.code === 'MODULE_NOT_FOUND') {
      console.error('❌ Secrets management module not found.');
      console.error('   This script requires the secrets-management module to be available.');
      console.error('   Make sure the API directory structure is correct.');
      process.exit(1);
    } else {
      console.error('❌ Error checking secrets:', error);
      process.exit(1);
    }
  }
}

main().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
