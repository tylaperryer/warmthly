# TypeScript Configuration Guide

This document explains the TypeScript configuration hierarchy and the purpose of each config file.

## Configuration Hierarchy

Warmthly uses multiple TypeScript configuration files for different purposes:

```
warmthly/
├── tsconfig.json                    # Root config (main project)
├── .config/tsconfig.json            # Config for .config/ directory
├── tests/tsconfig.json              # Test-specific config
└── scripts/tsconfig.json            # Script-specific config
```

## Config File Purposes

### 1. Root `tsconfig.json`

**Purpose:** Main TypeScript configuration for the entire project  
**Used by:** Vite, IDE, general type checking  
**Includes:**

- `lego/**/*` - Component library
- `apps/**/*.ts` - Application code
- `api/**/*.ts` - API code
- `scripts/**/*.ts` - Scripts (via include)

**Excludes:**

- `scripts/**/*` - Excluded to prevent conflicts (scripts have own config)
- `**/*.test.ts` - Test files (tests have own config)
- `dist`, `build`, `coverage` - Build outputs

**Note:** While `scripts/**/*.ts` is included in the `include` array, it's also excluded. This is intentional - scripts use their own config that extends root.

### 2. `.config/tsconfig.json`

**Purpose:** TypeScript config for files in `.config/` directory  
**Used by:** Vite config, Vitest config, Playwright config  
**Includes:**

- `../scripts/**/*.ts` - Scripts (for config files that reference scripts)
- `../lego/**/*` - Component library
- `../apps/**/*.ts` - Application code

**Why separate?**

- Config files in `.config/` need to reference scripts
- Different `baseUrl` and path resolution
- Prevents circular dependencies

### 3. `tests/tsconfig.json`

**Purpose:** Test-specific TypeScript configuration  
**Used by:** Vitest, test files  
**Extends:** Root `tsconfig.json`  
**Special settings:**

- `noEmit: true` - Tests don't need output
- `types: []` - No default types (Vitest provides its own)
- `moduleResolution: "node"` - Node.js-style resolution for tests

**Includes:**

- All test files (`**/*.ts`, `**/*.tsx`)
- `types.d.ts` - Test type definitions

### 4. `scripts/tsconfig.json`

**Purpose:** Script-specific TypeScript configuration  
**Used by:** Build scripts, validation scripts, automation scripts  
**Extends:** Root `tsconfig.json`  
**Special settings:**

- `noEmit: true` - Scripts run directly via tsx
- `moduleResolution: "bundler"` - Modern module resolution

**Includes:**

- All script files (`**/*.ts`)

## Why Multiple Configs?

1. **Different Environments:**
   - Main code: Browser + Node.js (Vite)
   - Tests: Node.js only (Vitest)
   - Scripts: Node.js only (tsx)

2. **Different Module Resolution:**
   - Main code: `bundler` (Vite handles bundling)
   - Tests: `node` (Vitest runs in Node.js)
   - Scripts: `bundler` (tsx handles execution)

3. **Different Type Checking Needs:**
   - Main code: Full type checking
   - Tests: Relaxed types (Vitest types)
   - Scripts: Full type checking but no emit

## Path Aliases

All configs share the same path aliases (defined in root `tsconfig.json`):

```json
{
  "@/*": ["./*"],
  "@lego/*": ["./lego/*"],
  "@components/*": ["./lego/components/*"],
  "@utils/*": ["./lego/utils/*"],
  "@config/*": ["./lego/config/*"],
  "@styles/*": ["./lego/styles/*"],
  "@core/*": ["./lego/core/*"],
  "@apps/*": ["./apps/*"],
  "@api/*": ["./api/*"],
  "@assets/*": ["./assets/*"],
  "@tests/*": ["./tests/*"]
}
```

## Type Checking Commands

```bash
# Type check main project (uses root tsconfig.json)
npm run type-check

# Type check tests (uses tests/tsconfig.json)
# Run via: npm test (Vitest uses tests/tsconfig.json)

# Type check scripts (uses scripts/tsconfig.json)
# Run via: tsx scripts/script-name.ts
```

## Common Issues

### Issue: Scripts not type-checked

**Solution:** Scripts have their own config. Run scripts via `tsx` which uses `scripts/tsconfig.json`.

### Issue: Config files can't find scripts

**Solution:** `.config/tsconfig.json` includes scripts explicitly. This is intentional.

### Issue: Tests have type errors

**Solution:** Tests use `tests/tsconfig.json` which extends root but has different settings. Check that test types are correct.

## Best Practices

1. **Always extend root config** for consistency
2. **Use path aliases** instead of relative imports
3. **Keep configs minimal** - only override what's necessary
4. **Document any non-standard settings** in config comments

## Related Documentation

- `warmthly/tsconfig.json` - Root configuration
- `warmthly/tests/tsconfig.json` - Test configuration
- `warmthly/scripts/tsconfig.json` - Script configuration
- `warmthly/.config/tsconfig.json` - Config directory configuration
