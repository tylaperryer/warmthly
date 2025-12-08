# Configuration Files Guide

This document explains the organization and purpose of all configuration files in the Warmthly project.

## Configuration File Organization

Configuration files are split between two locations for organizational reasons:

### Root Directory (`warmthly/`)
**Purpose:** Project-level configuration that tools expect at root  
**Files:**
- `package.json` - NPM package configuration, dependencies, scripts
- `tsconfig.json` - Main TypeScript configuration (extends to other configs)
- `README.md` - Project documentation
- `CONTRIBUTING.md` - Contribution guidelines
- `DEPLOYMENT-GUIDE.md` - Deployment instructions

**Why root?**
- Standard location expected by tools (npm, TypeScript, GitHub)
- Easier to find for new developers
- Follows common project structure conventions

### `.config/` Directory (`warmthly/.config/`)
**Purpose:** Build and tool-specific configuration  
**Files:**
- `vite.config.ts` - Vite build configuration
- `vitest.config.ts` - Vitest test configuration
- `playwright.config.ts` - Playwright E2E test configuration
- `.eslintrc.json` - ESLint code quality rules
- `.prettierrc.json` - Prettier code formatting rules
- `.stylelintrc.json` - Stylelint CSS linting rules
- `postcss.config.js` - PostCSS CSS processing configuration
- `tsconfig.json` - TypeScript config for `.config/` directory
- `wrangler.toml` - Cloudflare Pages configuration (reference only)

**Why `.config/`?**
- Keeps build configs organized in one place
- Separates tool configs from project configs
- Makes it clear these are build-time configurations
- Easier to manage multiple config files

## Configuration File Details

### TypeScript Configuration

See `docs/TYPESCRIPT-CONFIG.md` for detailed TypeScript configuration guide.

**Files:**
- `tsconfig.json` - Root config (main project)
- `.config/tsconfig.json` - Config directory config
- `tests/tsconfig.json` - Test config
- `scripts/tsconfig.json` - Scripts config

### Build Configuration

**`vite.config.ts`**
- Vite bundler configuration
- Entry points for all apps
- Code splitting strategy
- Build optimizations
- Asset handling

**`postcss.config.js`**
- CSS processing (Autoprefixer, Nesting, Container Queries)
- CSS minification
- Browser compatibility

### Testing Configuration

**`vitest.config.ts`**
- Unit test configuration
- Coverage thresholds
- Test environment setup

**`playwright.config.ts`**
- E2E test configuration
- Browser projects (Chromium, Firefox, WebKit)
- Test reporting
- Web server configuration

### Code Quality Configuration

**`.eslintrc.json`**
- ESLint rules for code quality
- TypeScript-aware linting
- Import ordering rules
- Extends: ESLint recommended, TypeScript ESLint, Prettier

**`.prettierrc.json`**
- Code formatting rules
- Consistent style across codebase
- Line ending normalization (LF)
- Markdown prose wrapping

**`.stylelintrc.json`**
- CSS linting rules
- Prevents CSS injection vulnerabilities
- Enforces CSS best practices
- Extends: Stylelint standard, Prettier

## Path References

### Configs in `.config/` Directory

Configs in `.config/` use relative paths to reference files in parent directories:

```typescript
// .config/vite.config.ts
resolve(__dirname, '../apps/main/index.html')  // ✅ Correct

// .config/.eslintrc.json
"project": "../tsconfig.json"  // ✅ Correct
```

### Configs in Root

Configs in root use relative paths from root:

```typescript
// tsconfig.json
"include": ["lego/**/*"]  // ✅ Correct (from root)
```

## Configuration Hierarchy

1. **Root `tsconfig.json`** - Base configuration
2. **`.config/tsconfig.json`** - Extends root, adds config-specific settings
3. **`tests/tsconfig.json`** - Extends root, adds test-specific settings
4. **`scripts/tsconfig.json`** - Extends root, adds script-specific settings

## When to Modify Configs

### TypeScript Config (`tsconfig.json`)
- Adding new path aliases
- Changing strict mode settings
- Adding new include/exclude patterns
- Changing target or module settings

### Build Config (`vite.config.ts`)
- Adding new entry points
- Changing code splitting strategy
- Adjusting performance budgets
- Adding new plugins

### Test Configs
- Changing coverage thresholds
- Adding new test environments
- Configuring test timeouts
- Adding test utilities

### Linting Configs
- Adding new rules
- Adjusting rule severity
- Adding new plugins
- Configuring file patterns

### Internationalization (i18n) Configuration

**Files:**
- `lego/i18n/` - Translation files and schema
- `lego/i18n/schema.json` - Translation file schema
- `lego/i18n/*.json` - Language translation files (en.json, es.json, fr.json, etc.)
- `lego/utils/i18n.ts` - i18n utility functions
- `lego/utils/rtl-support.ts` - RTL (Right-to-Left) language support
- `lego/components/warmthly-i18n.ts` - i18n web component
- `scripts/validate-i18n.ts` - i18n validation script

**Configuration:**
- Translation files follow JSON schema defined in `schema.json`
- Language codes follow ISO 639-1 standard (e.g., `en`, `es`, `fr`)
- RTL languages automatically detected and styled
- API endpoints configured in backend (`warmthly-api/functions/api/i18n/`)

**Environment Variables:**
- `LIBRETRANSLATE_URL` - LibreTranslate instance URL (optional)
- `LIBRETRANSLATE_API_KEY` - LibreTranslate API key (optional)
- `HUGGINGFACE_API_KEY` - Hugging Face API key for NLLB translations (optional)
- `TRANSLATION_CACHE` - Cloudflare KV namespace for caching (optional)

**When to modify:**
- Adding new language translations
- Updating translation keys
- Changing translation providers
- Adjusting RTL language support

**Related Documentation:**
- `docs/LANGUAGE-SUPPORT.md` - Complete language support guide
- `lego/i18n/README.md` - i18n component usage
- `docs/ADRs/004-i18n-architecture.md` - i18n architecture decision

## Best Practices

1. **Document changes** - Add comments when modifying configs
2. **Test after changes** - Verify builds/tests still work
3. **Keep consistent** - Use same patterns across configs
4. **Version control** - All configs should be in git
5. **Don't duplicate** - Use extends/inheritance where possible

## Troubleshooting

### Issue: Config not found
**Solution:** Check path references - configs in `.config/` need `../` prefix

### Issue: TypeScript errors after config change
**Solution:** Restart TypeScript server in IDE, clear cache

### Issue: Build fails after config change
**Solution:** Check path aliases, verify all references are correct

### Issue: Tests don't run
**Solution:** Check test config extends root config correctly

## Related Documentation

- `docs/TYPESCRIPT-CONFIG.md` - Detailed TypeScript configuration guide
- `warmthly/README.md` - Project overview
- `warmthly/CONTRIBUTING.md` - Contribution guidelines

