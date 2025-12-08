#!/usr/bin/env python3
"""
Script to reorganize API files into subdirectories and update imports
"""

import os
import re
import shutil
from pathlib import Path

# File mappings: (source, destination, category)
FILE_MAPPINGS = [
    # Auth files
    ('login.ts', 'auth/login.ts', 'auth'),
    ('mfa-setup.ts', 'auth/mfa-setup.ts', 'auth'),
    ('totp.ts', 'auth/totp.ts', 'auth'),
    
    # Security files
    ('csrf.ts', 'security/csrf.ts', 'security'),
    ('secure-cookies.ts', 'security/secure-cookies.ts', 'security'),
    ('security-monitor.ts', 'security/security-monitor.ts', 'security'),
    ('security-exporter.ts', 'security/security-exporter.ts', 'security'),
    ('anomaly-detection.ts', 'security/anomaly-detection.ts', 'security'),
    ('certificate-monitoring.ts', 'security/certificate-monitoring.ts', 'security'),
    ('request-signing.ts', 'security/request-signing.ts', 'security'),
    ('request-timeout.ts', 'security/request-timeout.ts', 'security'),
    
    # Middleware files
    ('rate-limit.ts', 'middleware/rate-limit.ts', 'middleware'),
    ('rate-limit-enhanced.ts', 'middleware/rate-limit-enhanced.ts', 'middleware'),
    ('input-validation.ts', 'middleware/input-validation.ts', 'middleware'),
    ('api-versioning.ts', 'middleware/api-versioning.ts', 'middleware'),
    
    # Utils files
    ('logger.ts', 'utils/logger.ts', 'utils'),
    ('crypto-utils.ts', 'utils/crypto-utils.ts', 'utils'),
    ('redis-client.ts', 'utils/redis-client.ts', 'utils'),
    ('secrets-management.ts', 'utils/secrets-management.ts', 'utils'),
    ('advanced-secrets.ts', 'utils/advanced-secrets.ts', 'utils'),
    
    # Endpoint files
    ('airtable.ts', 'endpoints/airtable.ts', 'endpoints'),
    ('convert-currency.ts', 'endpoints/convert-currency.ts', 'endpoints'),
    ('create-checkout.ts', 'endpoints/create-checkout.ts', 'endpoints'),
    ('get-emails.ts', 'endpoints/get-emails.ts', 'endpoints'),
    ('get-yoco-public-key.ts', 'endpoints/get-yoco-public-key.ts', 'endpoints'),
    ('i18n.ts', 'endpoints/i18n.ts', 'endpoints'),
    ('inbound-email.ts', 'endpoints/inbound-email.ts', 'endpoints'),
    ('reports.ts', 'endpoints/reports.ts', 'endpoints'),
    ('send-email.ts', 'endpoints/send-email.ts', 'endpoints'),
    ('csp-report.ts', 'endpoints/csp-report.ts', 'endpoints'),
]

# Import path mappings for updating imports
IMPORT_MAPPINGS = {
    # Auth imports
    './login.js': '../auth/login.js',
    './mfa-setup.js': '../auth/mfa-setup.js',
    './totp.js': '../auth/totp.js',
    
    # Security imports
    './csrf.js': '../security/csrf.js',
    './secure-cookies.js': '../security/secure-cookies.js',
    './security-monitor.js': '../security/security-monitor.js',
    './security-exporter.js': '../security/security-exporter.js',
    './anomaly-detection.js': '../security/anomaly-detection.js',
    './certificate-monitoring.js': '../security/certificate-monitoring.js',
    './request-signing.js': '../security/request-signing.js',
    './request-timeout.js': '../security/request-timeout.js',
    
    # Middleware imports
    './rate-limit.js': '../middleware/rate-limit.js',
    './rate-limit-enhanced.js': '../middleware/rate-limit-enhanced.js',
    './input-validation.js': '../middleware/input-validation.js',
    './api-versioning.js': '../middleware/api-versioning.js',
    
    # Utils imports
    './logger.js': '../utils/logger.js',
    './crypto-utils.js': '../utils/crypto-utils.js',
    './redis-client.js': '../utils/redis-client.js',
    './secrets-management.js': '../utils/secrets-management.js',
    './advanced-secrets.js': '../utils/advanced-secrets.js',
    
    # Endpoint imports (these stay as relative within endpoints or use utils/middleware)
    './airtable.js': '../endpoints/airtable.js',
    './convert-currency.js': '../endpoints/convert-currency.js',
    './create-checkout.js': '../endpoints/create-checkout.js',
    './get-emails.js': '../endpoints/get-emails.js',
    './get-yoco-public-key.js': '../endpoints/get-yoco-public-key.js',
    './i18n.js': '../endpoints/i18n.js',
    './inbound-email.js': '../endpoints/inbound-email.js',
    './reports.js': '../endpoints/reports.js',
    './send-email.js': '../endpoints/send-email.js',
    './csp-report.js': '../endpoints/csp-report.js',
}

# Category-based import paths (for files within same category)
CATEGORY_IMPORTS = {
    'auth': {
        './totp.js': './totp.js',  # Same directory
        './login.js': './login.js',
        './mfa-setup.js': './mfa-setup.js',
    },
    'security': {
        './security-monitor.js': './security-monitor.js',
        './crypto-utils.js': '../utils/crypto-utils.js',
    },
    'middleware': {
        './rate-limit.js': './rate-limit.js',
        './rate-limit-enhanced.js': './rate-limit-enhanced.js',
    },
    'utils': {
        './logger.js': './logger.js',
        './crypto-utils.js': './crypto-utils.js',
        './redis-client.js': './redis-client.js',
    },
    'endpoints': {
        # Endpoints use utils and middleware
    }
}

def update_imports_in_file(file_path: Path, category: str):
    """Update import paths in a file based on its new location"""
    content = file_path.read_text(encoding='utf-8')
    original_content = content
    
    # Update imports based on category
    for old_import, new_import in IMPORT_MAPPINGS.items():
        # Handle both './file.js' and 'from './file.js'
        patterns = [
            (rf"from\s+['\"]{re.escape(old_import)}['\"]", f"from '{new_import}'"),
            (rf"import\s+.*\s+from\s+['\"]{re.escape(old_import)}['\"]", lambda m: m.group(0).replace(old_import, new_import)),
        ]
        
        for pattern, replacement in patterns:
            if isinstance(replacement, str):
                content = re.sub(pattern, replacement, content)
            else:
                content = re.sub(pattern, replacement, content)
    
    # Special handling for same-category imports
    if category in CATEGORY_IMPORTS:
        for old_import, new_import in CATEGORY_IMPORTS[category].items():
            content = re.sub(
                rf"from\s+['\"]{re.escape(old_import)}['\"]",
                f"from '{new_import}'",
                content
            )
    
    if content != original_content:
        file_path.write_text(content, encoding='utf-8')
        return True
    return False

def main():
    api_dir = Path('warmthly/api')
    
    if not api_dir.exists():
        print(f"Error: {api_dir} does not exist")
        return
    
    # Create subdirectories
    for category in ['auth', 'security', 'middleware', 'utils', 'endpoints']:
        (api_dir / category).mkdir(exist_ok=True)
    
    # Move files and update imports
    moved_files = []
    for source_file, dest_file, category in FILE_MAPPINGS:
        source_path = api_dir / source_file
        dest_path = api_dir / dest_file
        
        if not source_path.exists():
            print(f"Warning: {source_path} does not exist, skipping")
            continue
        
        # Copy file to new location
        shutil.copy2(source_path, dest_path)
        
        # Update imports in the moved file
        update_imports_in_file(dest_path, category)
        
        moved_files.append((source_path, dest_path))
        print(f"Moved {source_file} -> {dest_file}")
    
    print(f"\nMoved {len(moved_files)} files")
    print("\nNext steps:")
    print("1. Update imports in files that reference these moved files")
    print("2. Delete the original files after verifying everything works")
    print("3. Update documentation")

if __name__ == '__main__':
    main()

