# Component System

Complete guide to the Warmthly component system.

## Overview

The Warmthly component system is built on a foundation of:
- **Base Component Class** - Consistent lifecycle and error handling
- **Form Components** - Accessible, validated form elements
- **Loading Components** - Better perceived performance
- **Accessibility Components** - WCAG 2.1 AA compliant primitives

All components are:
- ✅ Privacy-first (no tracking, no cookies, no analytics)
- ✅ Accessible (keyboard navigation, screen readers, ARIA)
- ✅ Type-safe (full TypeScript support)
- ✅ Tested (99% coverage target)

## Implementation Summary

World-class component system implementation completed for Warmthly. All components are privacy-first, accessible, and production-ready.

### File Structure

```
lego/
├── core/
│   └── base-component.ts          # Base component class
├── components/
│   ├── forms/                     # Form components
│   │   ├── warmthly-form.ts
│   │   ├── warmthly-input.ts
│   │   ├── warmthly-textarea.ts
│   │   ├── warmthly-select.ts
│   │   ├── warmthly-button.ts
│   │   ├── warmthly-field-group.ts
│   │   └── index.ts
│   ├── loading/                   # Loading components
│   │   ├── warmthly-skeleton.ts
│   │   ├── warmthly-spinner.ts
│   │   ├── warmthly-progress.ts
│   │   └── index.ts
│   └── a11y/                      # Accessibility components
│       ├── warmthly-modal.ts
│       ├── warmthly-tooltip.ts
│       └── index.ts
├── design-system/                 # Design system docs
│   ├── tokens.md
│   ├── components.md
│   └── patterns.md
├── utils/
│   └── component-helpers.ts       # Component utilities
└── styles/
    └── components.css              # Component styles
```

## Base Component

All components extend `BaseComponent` which provides:

### Lifecycle Hooks

```typescript
class MyComponent extends BaseComponent {
  protected onConnect(): void {
    // Called when component connects to DOM
  }

  protected onDisconnect(): void {
    // Called when component disconnects from DOM
  }

  protected onAttributeChange(name: string, oldValue: string | null, newValue: string | null): void {
    // Called when observed attributes change
  }

  protected onAdopted(): void {
    // Called when component is adopted into new document
  }
}
```

### Error Handling

```typescript
// Automatic error boundary integration
this.handleError(error, {
  severity: ErrorSeverity.MEDIUM,
  component: 'MyComponent',
  operation: 'doSomething',
  userMessage: 'Something went wrong',
  recoverable: true
});
```

### Type-Safe Attributes

```typescript
// Get attribute
const value = this.getAttr('value');

// Set attribute
this.setAttr('value', 'new value');

// Boolean attributes
const isDisabled = this.getBoolAttr('disabled');
this.setBoolAttr('disabled', true);
```

## Component Categories

### Form Components

Complete form system with validation:

- `warmthly-form` - Base form with validation and submission
- `warmthly-input` - Input field with validation
- `warmthly-textarea` - Textarea with validation
- `warmthly-select` - Select dropdown
- `warmthly-button` - Button with loading states
- `warmthly-field-group` - Field grouping with label/help/error

See [Design System Components](../lego/design-system/components.md) for full API.

### Loading Components

Better perceived performance:

- `warmthly-skeleton` - Loading placeholder (text, rect, circle variants)
- `warmthly-spinner` - Loading spinner (small, medium, large)
- `warmthly-progress` - Progress bar (determinate/indeterminate)

### Accessibility Components

WCAG 2.1 AA compliant:

- `warmthly-modal` - Accessible modal dialog with focus trap
- `warmthly-tooltip` - Accessible tooltip with positioning

## Usage Examples

### Basic Form

```html
<warmthly-form action="/api/submit" method="post">
  <warmthly-field-group label="Email" required>
    <warmthly-input name="email" type="email" placeholder="your@email.com"></warmthly-input>
  </warmthly-field-group>
  
  <warmthly-button type="submit" variant="primary">Submit</warmthly-button>
</warmthly-form>
```

### Loading States

```html
<!-- Skeleton -->
<warmthly-skeleton variant="text" lines="3"></warmthly-skeleton>

<!-- Spinner -->
<warmthly-spinner size="medium" label="Loading..."></warmthly-spinner>

<!-- Progress -->
<warmthly-progress value="50" max="100"></warmthly-progress>
```

### Modal

```html
<warmthly-modal id="myModal" title="Confirm Action">
  <p>Are you sure?</p>
  <warmthly-button slot="footer" onclick="closeModal()">Cancel</warmthly-button>
  <warmthly-button slot="footer" variant="primary" onclick="confirm()">Confirm</warmthly-button>
</warmthly-modal>
```

## Component Helpers

Utilities for component creation:

```typescript
import { createComponent, withValidation, withLoading } from '@utils/component-helpers.js';

// Create component
const MyComponent = createComponent({
  name: 'my-component',
  class: MyComponentClass,
  observedAttributes: ['value'],
  useShadowDOM: true
});

// Compose with features
const ValidatedComponent = withValidation(MyComponent);
const LoadingComponent = withLoading(MyComponent);
```

## Design System

Complete design system documentation:

- [Design Tokens](../lego/design-system/tokens.md) - Colors, spacing, typography
- [Component API](../lego/design-system/components.md) - Full component reference
- [Usage Patterns](../lego/design-system/patterns.md) - Common patterns

## Privacy & Security

All components are privacy-first:
- ✅ No tracking
- ✅ No cookies
- ✅ No analytics
- ✅ No third-party scripts
- ✅ Client-side only

## Accessibility

All components follow WCAG 2.1 AA:
- ✅ Keyboard navigation
- ✅ Screen reader support
- ✅ ARIA attributes
- ✅ Focus management
- ✅ Color contrast

## Testing

Components are tested with:
- Unit tests (99% coverage target)
- Integration tests
- E2E tests
- Accessibility tests

## Migration Guide

To migrate existing components to use `BaseComponent`:

1. Extend `BaseComponent` instead of `HTMLElement`
2. Use lifecycle hooks instead of `connectedCallback`
3. Use type-safe attribute helpers
4. Integrate with error boundary

## Quality Assurance

- ✅ No linter errors
- ✅ TypeScript strict mode compliant
- ✅ Privacy-first (no tracking)
- ✅ Accessibility compliant
- ✅ Documentation complete

## Impact

This implementation elevates Warmthly to world-class status by providing:

1. **Consistency** - All components follow same patterns
2. **Reusability** - Components work across all 4 apps
3. **Accessibility** - WCAG 2.1 AA compliant
4. **Developer Experience** - Clear API and documentation
5. **User Experience** - Better loading states and form validation
6. **Maintainability** - Base class ensures consistency

The component system is production-ready and follows all privacy-first principles.
