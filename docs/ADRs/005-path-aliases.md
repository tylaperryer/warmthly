# ADR-005: Path Aliases for Imports

## Status

Accepted

## Context

We needed a way to import code that:

- Is clear and readable
- Can be refactored easily
- Works in TypeScript, Vite, and tests

## Decision

Use path aliases for all imports:

- `@components/*` → `./lego/components/*`
- `@utils/*` → `./lego/utils/*`
- `@config/*` → `./lego/config/*`
- `@styles/*` → `./lego/styles/*`
- `@apps/*` → `./apps/*`
- `@api/*` → `./api/*`
- `@assets/*` → `./assets/*`
- `@tests/*` → `./tests/*`

## Rationale

1. **Clarity**: `@components/header` is clearer than `../../../lego/components/header`
2. **Refactorable**: Change path in one place (tsconfig, vite.config)
3. **Consistent**: Same paths work in code, tests, and build
4. **IDE Support**: Autocomplete works better
5. **No Relative Hell**: No more `../../../../` chains

## Consequences

- ✅ Clean, readable imports
- ✅ Easy refactoring
- ✅ Consistent across tools
- ⚠️ Must configure in multiple places (tsconfig, vite, vitest)
- ⚠️ Must use `.js` extension (ESM requirement)

## Implementation Details

Configured in:

- `tsconfig.json` - TypeScript resolution
- `.config/vite.config.ts` - Build resolution
- `.config/vitest.config.ts` - Test resolution

All use same alias definitions for consistency.

## Alternatives Considered

1. **Relative paths**: Too messy, hard to refactor
2. **npm packages**: Overhead, versioning complexity
3. **Single alias (`@/*`)**: Less clear organization
