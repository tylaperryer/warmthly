# Dependency Versioning Strategy

This document explains the dependency versioning strategy used in the Warmthly project.

## Versioning Strategy Overview

Warmthly uses a **hybrid versioning strategy** that balances stability with flexibility:

- **Exact versions** (`5.0.0`) for critical build tools and core dependencies
- **Caret ranges** (`^5.3.3`) for less critical dependencies and type definitions
- **Tilde ranges** (not currently used) for patch-only updates

## Version Pinning Rules

### Exact Versions (Pinned)

**When to use:**
- Critical build tools (Vite, TypeScript compiler)
- Core runtime dependencies that affect production behavior
- Dependencies with breaking changes in minor versions
- Dependencies where version consistency is critical

**Examples:**
```json
{
  "vite": "5.0.0",           // Build tool - exact version ensures consistency
  "@playwright/test": "1.40.0",  // Testing framework - exact version for CI stability
  "terser": "5.24.0"         // Minification - exact version for reproducible builds
}
```

**Rationale:**
- Build tools need to be consistent across all environments
- Testing frameworks should be identical in CI and local development
- Production dependencies should be predictable

### Caret Ranges (^)

**When to use:**
- Type definitions (`@types/*`)
- Development dependencies that don't affect production
- Dependencies with stable APIs
- Dependencies where minor updates are safe

**Examples:**
```json
{
  "typescript": "^5.3.3",              // Type definitions - safe to update minor versions
  "@types/node": "20.10.0",            // Type definitions - exact for Node version
  "eslint-config-prettier": "9.0.0"    // Config - stable API
}
```

**Rationale:**
- Type definitions are additive and safe to update
- Development tools can benefit from minor updates
- Caret allows automatic patch and minor updates

## Dependency Categories

### Critical Dependencies (Exact Versions)

These dependencies are pinned to exact versions:

- **Build Tools:**
  - `vite: 5.0.0` - Core build tool
  - `typescript: ^5.3.3` - TypeScript compiler (caret for patch updates)
  - `terser: 5.24.0` - JavaScript minification

- **Testing:**
  - `@playwright/test: 1.40.0` - E2E testing framework
  - `vitest: 1.0.0` - Unit testing framework

- **Code Quality:**
  - `eslint: 8.54.0` - Linting
  - `prettier: 3.1.0` - Code formatting
  - `stylelint: 16.0.2` - CSS linting

### Standard Dependencies (Caret Ranges)

These dependencies use caret ranges:

- **Type Definitions:**
  - `@types/*` - All TypeScript type definitions

- **Development Tools:**
  - `tsx: 4.7.0` - TypeScript execution
  - `husky: 8.0.3` - Git hooks
  - `lint-staged: 15.2.0` - Pre-commit linting

- **PostCSS Plugins:**
  - `postcss-container-queries: ^1.0.1` - Container queries support
  - `postcss-nesting: 12.0.1` - CSS nesting support

## Updating Dependencies

### Regular Updates

1. **Check for updates:**
   ```bash
   npm outdated
   ```

2. **Security updates:**
   ```bash
   npm audit
   npm audit fix
   ```

3. **Update strategy:**
   - **Security patches:** Update immediately
   - **Patch versions:** Update regularly (monthly)
   - **Minor versions:** Review and test before updating
   - **Major versions:** Plan migration, test thoroughly

### Update Process

1. **Create a branch:**
   ```bash
   git checkout -b update-dependencies
   ```

2. **Update dependencies:**
   ```bash
   # For exact versions, manually update package.json
   # For caret ranges, npm update will handle it
   npm update
   ```

3. **Test thoroughly:**
   ```bash
   npm run build
   npm run test
   npm run test:e2e
   ```

4. **Commit and push:**
   ```bash
   git add package.json package-lock.json
   git commit -m "chore: update dependencies"
   ```

### When to Pin vs. Use Ranges

**Pin (exact version) when:**
- Dependency is critical to build process
- Breaking changes are common in minor versions
- Version consistency is required across environments
- Dependency affects production behavior

**Use range (^) when:**
- Dependency is a development tool
- Minor updates are safe and beneficial
- Dependency has stable API
- Type definitions (always use ranges or exact for specific Node version)

## Security Considerations

1. **Regular audits:**
   ```bash
   npm audit
   npm audit fix
   ```

2. **Automated updates:**
   - Dependabot is configured (`.github/dependabot.yml`)
   - Reviews security updates automatically

3. **Production dependencies:**
   - Keep production dependencies minimal
   - Review all new dependencies before adding

## Best Practices

1. **Document breaking changes:**
   - When updating major versions, document changes
   - Update migration guides if needed

2. **Test after updates:**
   - Always run full test suite after dependency updates
   - Test in CI before merging

3. **Lock file:**
   - Always commit `package-lock.json`
   - Ensures consistent installs across environments

4. **Version consistency:**
   - Use same versioning strategy across similar dependencies
   - Document exceptions

## Related Documentation

- `warmthly/package.json` - Dependency definitions
- `.github/dependabot.yml` - Automated dependency updates
- `warmthly/CONTRIBUTING.md` - Contribution guidelines

