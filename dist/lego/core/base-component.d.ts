/**
 * Base Component Class
 * Foundation for all Web Components in the Warmthly system
 * Provides consistent lifecycle, error handling, and state management
 * Privacy-first: No tracking, no cookies, no analytics
 */
import { type ErrorContext } from './error-boundary.js';
import { type ILoggerService } from './services/index.js';
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
export declare abstract class BaseComponent extends HTMLElement implements ComponentLifecycle {
    protected readonly logger: ILoggerService;
    protected readonly errorBoundary: import("./error-boundary.js").ErrorBoundary;
    private readonly shadowRootInternal;
    private isConnectedInternal;
    private attributeChangeQueue;
    /**
     * Get shadow root (creates if needed)
     */
    protected get shadow(): ShadowRoot | null;
    /**
     * Check if component is connected
     */
    protected get isConnectedState(): boolean;
    constructor(options?: ComponentOptions);
    /**
     * Get observed attributes
     */
    static get observedAttributes(): readonly string[];
    /**
     * Called when element is inserted into DOM
     */
    connectedCallback(): void;
    /**
     * Called when element is removed from DOM
     */
    disconnectedCallback(): void;
    /**
     * Called when an observed attribute changes
     */
    attributeChangedCallback(name: string, oldValue: string | null, newValue: string | null): void;
    /**
     * Called when element is adopted into a new document
     */
    adoptedCallback(): void;
    /**
     * Process queued attribute changes
     */
    private processAttributeQueue;
    /**
     * Process a single attribute change
     */
    private processAttributeChange;
    /**
     * Safely execute a function with error handling
     */
    protected safeExecute<T>(fn: () => T): T | undefined;
    /**
     * Safely execute an async function with error handling
     */
    protected safeExecuteAsync<T>(fn: () => Promise<T>): Promise<T | undefined>;
    /**
     * Handle an error with error boundary
     */
    protected handleError(error: unknown, context: Partial<ErrorContext>): void;
    /**
     * Handle an error asynchronously
     */
    protected handleErrorAsync(error: unknown, context: Partial<ErrorContext>): Promise<void>;
    /**
     * Get attribute value with type safety
     */
    protected getAttr(name: string): string | null;
    /**
     * Get attribute value or default
     */
    protected getAttrOrDefault(name: string, defaultValue: string): string;
    /**
     * Check if attribute exists
     */
    protected hasAttr(name: string): boolean;
    /**
     * Set attribute safely
     */
    protected setAttr(name: string, value: string | null): void;
    /**
     * Get boolean attribute
     */
    protected getBoolAttr(name: string): boolean;
    /**
     * Set boolean attribute
     */
    protected setBoolAttr(name: string, value: boolean): void;
    /**
     * Dispatch a custom event
     */
    protected dispatch<T = unknown>(eventName: string, detail?: T, bubbles?: boolean, cancelable?: boolean): boolean;
    /**
     * Query selector within component (shadow or light DOM)
     */
    protected query<T extends Element = Element>(selector: string): T | null;
    /**
     * Query selector all within component
     */
    protected queryAll<T extends Element = Element>(selector: string): NodeListOf<T>;
    /**
     * Render content to shadow root or element
     */
    protected render(html: string): void;
    /**
     * Lifecycle hooks (to be implemented by subclasses)
     */
    protected onConnect?(): void | Promise<void>;
    protected onDisconnect?(): void;
    protected onAttributeChange?(name: string, oldValue: string | null, newValue: string | null): void;
    protected onAdopted?(): void;
}
//# sourceMappingURL=base-component.d.ts.map