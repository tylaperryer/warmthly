/**
 * Component Helpers
 * Utilities for creating and composing components
 * Privacy-first: No tracking, no cookies
 */

import { BaseComponent, type ComponentOptions } from '@core/base-component.js';

/**
 * Component definition for factory
 */
export interface ComponentDefinition<T extends BaseComponent = BaseComponent> {
  readonly name: string;
  readonly class: new (options?: ComponentOptions) => T;
  readonly observedAttributes?: readonly string[];
  readonly useShadowDOM?: boolean;
  readonly shadowMode?: ShadowRootMode;
}

/**
 * Create and register a component
 */
export function createComponent<T extends BaseComponent>(
  definition: ComponentDefinition<T>
): new () => T {
  const { name, class: ComponentClass, observedAttributes, useShadowDOM, shadowMode } = definition;

  // Create component class with options
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  class Component extends (ComponentClass as any) {
    static get observedAttributes(): readonly string[] {
      return observedAttributes || [];
    }

    constructor() {
      super({
        observedAttributes,
        useShadowDOM,
        shadowMode,
      });
    }
  }

  // Register component
  if (!customElements.get(name)) {
    customElements.define(name, Component as unknown as CustomElementConstructor);
  }

  return Component as unknown as new () => T;
}

/**
 * Create a component with validation
 */
export function withValidation<T extends BaseComponent>(
  ComponentClass: new (options?: ComponentOptions) => T
): new (options?: ComponentOptions) => T {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return class extends (ComponentClass as any) {
    protected validate(): boolean {
      // Override to add validation logic
      return true;
    }
  } as unknown as new (options?: ComponentOptions) => T;
}

/**
 * Create a component with loading state
 */
export function withLoading<T extends BaseComponent>(
  ComponentClass: new (options?: ComponentOptions) => T
): new (options?: ComponentOptions) => T {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return class extends (ComponentClass as any) {
    private loadingState = false;

    protected setLoading(loading: boolean): void {
      this.loadingState = loading;
      // Use public methods or access protected methods through this
      if ('setBoolAttr' in this && typeof (this as unknown as { setBoolAttr: (name: string, value: boolean) => void }).setBoolAttr === 'function') {
        (this as unknown as { setBoolAttr: (name: string, value: boolean) => void }).setBoolAttr('loading', loading);
      }
      if ('dispatch' in this && typeof (this as unknown as { dispatch: (event: string, detail: unknown) => void }).dispatch === 'function') {
        (this as unknown as { dispatch: (event: string, detail: unknown) => void }).dispatch('component:loading', { loading });
      }
    }

    protected getLoading(): boolean {
      return this.loadingState;
    }
  } as unknown as new (options?: ComponentOptions) => T;
}

/**
 * Get component by name
 */
export function getComponent(name: string): CustomElementConstructor | undefined {
  return customElements.get(name);
}

/**
 * Check if component is registered
 */
export function isComponentRegistered(name: string): boolean {
  return customElements.get(name) !== undefined;
}

/**
 * Wait for component to be defined
 */
export function waitForComponent(name: string, timeout = 5000): Promise<CustomElementConstructor> {
  return new Promise((resolve, reject) => {
    const existing = customElements.get(name);
    if (existing) {
      resolve(existing);
      return;
    }

    const startTime = Date.now();
    const checkInterval = setInterval(() => {
      const component = customElements.get(name);
      if (component) {
        clearInterval(checkInterval);
        resolve(component);
      } else if (Date.now() - startTime > timeout) {
        clearInterval(checkInterval);
        reject(new Error(`Component ${name} not defined within ${timeout}ms`));
      }
    }, 100);
  });
}

/**
 * Upgrade elements to custom elements
 */
export function upgradeElements(selector: string, componentName: string): void {
  const elements = document.querySelectorAll(selector);
  const ComponentClass = customElements.get(componentName);
  if (!ComponentClass) {
    return;
  }
  
  elements.forEach((element) => {
    if (!(element instanceof ComponentClass)) {
      customElements.upgrade(element);
    }
  });
}

