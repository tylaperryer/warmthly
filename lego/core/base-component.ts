/**
 * Base Component Class
 * Foundation for all Web Components in the Warmthly system
 * Provides consistent lifecycle, error handling, and state management
 * Privacy-first: No tracking, no cookies, no analytics
 */

import { getContainer } from './di-container.js';
import { getErrorBoundary, ErrorSeverity, type ErrorContext } from './error-boundary.js';
import { ServiceIdentifiers, type ILoggerService } from './services/index.js';

/**
 * Component lifecycle hooks
 */
export interface ComponentLifecycle {
  /**
   * Called when component is first connected to DOM
   * Use for initialization that doesn't depend on attributes
   */
  onConnect?(): void | Promise<void>;

  /**
   * Called when component is disconnected from DOM
   * Use for cleanup (event listeners, timers, etc.)
   */
  onDisconnect?(): void;

  /**
   * Called when an observed attribute changes
   * @param name - Attribute name
   * @param oldValue - Previous value
   * @param newValue - New value
   */
  onAttributeChange?(name: string, oldValue: string | null, newValue: string | null): void;

  /**
   * Called when component is adopted into a new document
   */
  onAdopted?(): void;
}

/**
 * Component options
 */
export interface ComponentOptions {
  /**
   * Attributes to observe for changes
   */
  readonly observedAttributes?: readonly string[];

  /**
   * Whether to use Shadow DOM (default: false)
   */
  readonly useShadowDOM?: boolean;

  /**
   * Shadow DOM mode: 'open' or 'closed' (default: 'open')
   */
  readonly shadowMode?: ShadowRootMode;
}

/**
 * Base Component Class
 * All Warmthly components should extend this class
 */
export abstract class BaseComponent extends HTMLElement implements ComponentLifecycle {
  protected readonly logger: ILoggerService;
  protected readonly errorBoundary = getErrorBoundary();
  private readonly shadowRootInternal: ShadowRoot | null;
  private isConnectedInternal = false;
  private attributeChangeQueue: Array<{
    name: string;
    oldValue: string | null;
    newValue: string | null;
  }> = [];

  /**
   * Get shadow root (creates if needed)
   */
  protected get shadow(): ShadowRoot | null {
    return this.shadowRootInternal;
  }

  /**
   * Check if component is connected
   */
  protected get isConnectedState(): boolean {
    return this.isConnectedInternal;
  }

  constructor(options: ComponentOptions = {}) {
    super();

    // Get logger from DI container
    const container = getContainer();
    if (!container.has(ServiceIdentifiers.Logger)) {
      // Logger should be registered, but handle gracefully
      this.logger = {
        debug: () => {},
        info: () => {},
        warn: () => {},
        error: () => {},
        setLevel: () => {},
        getLevel: () => 1,
      } as ILoggerService;
    } else {
      this.logger = container.resolve<ILoggerService>(ServiceIdentifiers.Logger);
    }

    // Create shadow root if requested
    if (options.useShadowDOM) {
      this.shadowRootInternal = this.attachShadow({
        mode: options.shadowMode || 'open',
      });
    } else {
      this.shadowRootInternal = null;
    }

    // Register observed attributes
    if (options.observedAttributes) {
      const observed = this.constructor as typeof BaseComponent & {
        observedAttributes?: readonly string[];
      };
      observed.observedAttributes = options.observedAttributes;
    }
  }

  /**
   * Get observed attributes
   */
  static get observedAttributes(): readonly string[] {
    return [];
  }

  /**
   * Called when element is inserted into DOM
   */
  connectedCallback(): void {
    this.isConnectedInternal = true;

    // Process any queued attribute changes
    this.processAttributeQueue();

    // Call lifecycle hook
    this.safeExecute(() => {
      const result = this.onConnect?.();
      if (result instanceof Promise) {
        result.catch((error: unknown) => {
          this.handleError(error, {
            severity: ErrorSeverity.MEDIUM,
            component: this.constructor.name,
            operation: 'onConnect',
            recoverable: true,
          });
        });
      }
    });
  }

  /**
   * Called when element is removed from DOM
   */
  disconnectedCallback(): void {
    this.isConnectedInternal = false;

    // Call lifecycle hook
    this.safeExecute(() => {
      this.onDisconnect?.();
    });
  }

  /**
   * Called when an observed attribute changes
   */
  attributeChangedCallback(name: string, oldValue: string | null, newValue: string | null): void {
    // Queue attribute changes if not yet connected
    if (!this.isConnectedInternal) {
      this.attributeChangeQueue.push({ name, oldValue, newValue });
      return;
    }

    // Process immediately if connected
    this.processAttributeChange(name, oldValue, newValue);
  }

  /**
   * Called when element is adopted into a new document
   */
  adoptedCallback(): void {
    this.safeExecute(() => {
      this.onAdopted?.();
    });
  }

  /**
   * Process queued attribute changes
   */
  private processAttributeQueue(): void {
    for (const change of this.attributeChangeQueue) {
      this.processAttributeChange(change.name, change.oldValue, change.newValue);
    }
    this.attributeChangeQueue = [];
  }

  /**
   * Process a single attribute change
   */
  private processAttributeChange(
    name: string,
    oldValue: string | null,
    newValue: string | null
  ): void {
    this.safeExecute(() => {
      this.onAttributeChange?.(name, oldValue, newValue);
    });
  }

  /**
   * Safely execute a function with error handling
   */
  protected safeExecute<T>(fn: () => T): T | undefined {
    try {
      return fn();
    } catch (error: unknown) {
      this.handleError(error, {
        severity: ErrorSeverity.MEDIUM,
        component: this.constructor.name,
        operation: 'safeExecute',
        recoverable: true,
      });
      return undefined;
    }
  }

  /**
   * Safely execute an async function with error handling
   */
  protected async safeExecuteAsync<T>(fn: () => Promise<T>): Promise<T | undefined> {
    try {
      return await fn();
    } catch (error: unknown) {
      await this.handleErrorAsync(error, {
        severity: ErrorSeverity.MEDIUM,
        component: this.constructor.name,
        operation: 'safeExecuteAsync',
        recoverable: true,
      });
      return undefined;
    }
  }

  /**
   * Handle an error with error boundary
   */
  protected handleError(error: unknown, context: Partial<ErrorContext>): void {
    const errorContext: ErrorContext = {
      severity: context.severity || ErrorSeverity.MEDIUM,
      component: context.component || this.constructor.name,
      operation: context.operation,
      userMessage: context.userMessage,
      recoverable: context.recoverable ?? true,
      metadata: context.metadata,
    };

    const errorObj = error instanceof Error ? error : new Error(String(error));
    void this.errorBoundary.handleError(errorObj, errorContext);
  }

  /**
   * Handle an error asynchronously
   */
  protected async handleErrorAsync(error: unknown, context: Partial<ErrorContext>): Promise<void> {
    const errorContext: ErrorContext = {
      severity: context.severity || ErrorSeverity.MEDIUM,
      component: context.component || this.constructor.name,
      operation: context.operation,
      userMessage: context.userMessage,
      recoverable: context.recoverable ?? true,
      metadata: context.metadata,
    };

    const errorObj = error instanceof Error ? error : new Error(String(error));
    await this.errorBoundary.handleError(errorObj, errorContext);
  }

  /**
   * Get attribute value with type safety
   */
  protected getAttr(name: string): string | null {
    return this.getAttribute(name);
  }

  /**
   * Get attribute value or default
   */
  protected getAttrOrDefault(name: string, defaultValue: string): string {
    return this.getAttribute(name) || defaultValue;
  }

  /**
   * Check if attribute exists
   */
  protected hasAttr(name: string): boolean {
    return this.hasAttribute(name);
  }

  /**
   * Set attribute safely
   */
  protected setAttr(name: string, value: string | null): void {
    if (value === null) {
      this.removeAttribute(name);
    } else {
      this.setAttribute(name, value);
    }
  }

  /**
   * Get boolean attribute
   */
  protected getBoolAttr(name: string): boolean {
    return this.hasAttribute(name);
  }

  /**
   * Set boolean attribute
   */
  protected setBoolAttr(name: string, value: boolean): void {
    if (value) {
      this.setAttribute(name, '');
    } else {
      this.removeAttribute(name);
    }
  }

  /**
   * Dispatch a custom event
   */
  protected dispatch<T = unknown>(
    eventName: string,
    detail?: T,
    bubbles = true,
    cancelable = true
  ): boolean {
    const event = new CustomEvent(eventName, {
      detail,
      bubbles,
      cancelable,
    });
    return this.dispatchEvent(event);
  }

  /**
   * Query selector within component (shadow or light DOM)
   */
  protected query<T extends Element = Element>(selector: string): T | null {
    if (this.shadowRootInternal) {
      return this.shadowRootInternal.querySelector<T>(selector);
    }
    return super.querySelector<T>(selector);
  }

  /**
   * Query selector all within component
   */
  protected queryAll<T extends Element = Element>(selector: string): NodeListOf<T> {
    if (this.shadowRootInternal) {
      return this.shadowRootInternal.querySelectorAll<T>(selector);
    }
    return super.querySelectorAll<T>(selector);
  }

  /**
   * Render content to shadow root or element
   */
  protected render(html: string): void {
    if (this.shadowRootInternal) {
      this.shadowRootInternal.innerHTML = html;
    } else {
      this.innerHTML = html;
    }
  }

  /**
   * Lifecycle hooks (to be implemented by subclasses)
   */
  public onConnect?(): void | Promise<void>;
  public onDisconnect?(): void;
  public onAttributeChange?(
    name: string,
    oldValue: string | null,
    newValue: string | null
  ): void;
  public onAdopted?(): void;
}
