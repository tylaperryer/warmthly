# ADR-002: TypeScript Strict Mode

## Status

Accepted

## Context

We migrated from JavaScript to TypeScript and needed to decide on strictness level.

## Decision

Enable TypeScript strict mode with all strict checks:

- `strict: true`
- `noUnusedLocals: true`
- `noUnusedParameters: true`
- `noImplicitReturns: true`
- `noFallthroughCasesInSwitch: true`

## Rationale

1. **Catch bugs early**: Strict mode finds errors at compile time
2. **Better refactoring**: TypeScript can safely rename/refactor
3. **Self-documenting**: Types serve as documentation
4. **Team consistency**: Everyone follows same rules
5. **Production confidence**: Fewer runtime errors

## Consequences

- ✅ Catches many bugs before deployment
- ✅ Better IDE autocomplete
- ✅ Safer refactoring
- ⚠️ More verbose code (explicit types)
- ⚠️ Learning curve for team members
- ⚠️ Some third-party libraries need type declarations

## Alternatives Considered

1. **Gradual strict mode**: Too easy to skip strict checks
2. **No strict mode**: Too many runtime errors
3. **Partial strict mode**: Inconsistent codebase

## Implementation Notes

- All new code must pass strict checks
- Legacy code gradually migrated
- `@ts-expect-error` used sparingly with comments
- Type definitions in `lego/utils/vite-env.d.ts`
