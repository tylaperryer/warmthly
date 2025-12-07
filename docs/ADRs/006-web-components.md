# ADR-006: Native Web Components

## Status
Accepted

## Context
We needed reusable UI components that:
- Work across all apps
- Have no framework dependency
- Are performant
- Are accessible

## Decision
Use native Web Components (Custom Elements API) for all reusable UI.

## Rationale
1. **No Framework Lock-in**: Works with any framework or vanilla JS
2. **Native Browser Support**: No runtime library needed
3. **Performance**: Native browser implementation
4. **Standards-Based**: W3C standard, future-proof
5. **Progressive Enhancement**: Works even if JS fails

## Consequences
- ✅ Zero framework dependencies
- ✅ Small bundle size
- ✅ Works everywhere
- ✅ Future-proof
- ⚠️ Less ecosystem than React/Vue
- ⚠️ Manual state management
- ⚠️ No SSR (but we don't need it)

## Implementation Pattern
```typescript
class MyComponent extends HTMLElement {
  connectedCallback() {
    // Initialize component
  }
}

customElements.define('my-component', MyComponent);
```

## Alternatives Considered
1. **React**: Too heavy, framework lock-in
2. **Vue**: Framework dependency
3. **Lit**: Still adds dependency
4. **jQuery**: Outdated, large bundle

## References
- [Web Components Specification](https://www.w3.org/TR/custom-elements/)
- [MDN Web Components Guide](https://developer.mozilla.org/en-US/docs/Web/Web_Components)

