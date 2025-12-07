# ADR-001: Lego Component Architecture

## Status
Accepted

## Context
We needed a way to share code across multiple applications (main, mint, post, admin) while maintaining:
- Code reusability
- Type safety
- Performance (code splitting)
- Maintainability
- Clear boundaries

## Decision
We adopted a "Lego" component architecture where shared code lives in a `lego/` directory with clear separation:

```
lego/
├── components/    # Web Components (reusable UI)
├── utils/         # Utility functions
├── config/        # Centralized configuration
├── styles/        # Shared CSS
└── i18n/          # Internationalization
```

## Rationale
1. **Web Components**: Native browser standard, no framework dependency, works everywhere
2. **Path Aliases**: `@components/*`, `@utils/*` etc. make imports clear and refactorable
3. **Code Splitting**: Vite automatically splits lego code into separate chunks
4. **Type Safety**: TypeScript ensures type safety across all apps
5. **Modularity**: Each piece is independent and can be used like Lego blocks

## Consequences
- ✅ Easy to share code across apps
- ✅ Clear import paths
- ✅ Automatic code splitting
- ✅ Type-safe across all apps
- ⚠️ Must use `.js` extensions in imports (ESM requirement)
- ⚠️ Components must be registered before use

## Alternatives Considered
1. **Monorepo with packages**: Too complex for our needs
2. **Shared npm package**: Overhead, versioning complexity
3. **Copy-paste**: Maintenance nightmare
4. **Framework (React/Vue)**: Adds dependency, bundle size

## Module Boundaries

As of the architecture improvements, modules now implement contracts:

- **Module Contracts**: All modules implement `IModule` interface
- **API Contracts**: API interactions follow `IApiClient` interface
- **Component Contracts**: Components implement `IComponent` interface
- **Contract Validation**: Validators ensure modules meet contract requirements

This ensures:
- Clear boundaries between modules
- Easy testing through contract validation
- Loose coupling
- Better maintainability

## References
- [Web Components Specification](https://developer.mozilla.org/en-US/docs/Web/Web_Components)
- [Vite Code Splitting](https://vitejs.dev/guide/build.html#chunking-strategy)
- [Architecture Documentation](../ARCHITECTURE.md)

