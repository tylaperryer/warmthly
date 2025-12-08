/**
 * Base Component Class
 * Foundation for all Web Components in the Warmthly system
 * Provides consistent lifecycle, error handling, and state management
 * Privacy-first: No tracking, no cookies, no analytics
 */
import { getContainer } from './di-container.js';
import { getErrorBoundary, ErrorSeverity } from './error-boundary.js';
import { ServiceIdentifiers } from './services/index.js';
/**
 * Base Component Class
 * All Warmthly components should extend this class
 */
export class BaseComponent extends HTMLElement {
    logger;
    errorBoundary = getErrorBoundary();
    shadowRootInternal;
    isConnectedInternal = false;
    attributeChangeQueue = [];
    /**
     * Get shadow root (creates if needed)
     */
    get shadow() {
        return this.shadowRootInternal;
    }
    /**
     * Check if component is connected
     */
    get isConnectedState() {
        return this.isConnectedInternal;
    }
    constructor(options = {}) {
        super();
        // Get logger from DI container
        const container = getContainer();
        if (!container.has(ServiceIdentifiers.Logger)) {
            // Logger should be registered, but handle gracefully
            this.logger = {
                debug: () => { },
                info: () => { },
                warn: () => { },
                error: () => { },
                setLevel: () => { },
                getLevel: () => 1,
            };
        }
        else {
            this.logger = container.resolve(ServiceIdentifiers.Logger);
        }
        // Create shadow root if requested
        if (options.useShadowDOM) {
            this.shadowRootInternal = this.attachShadow({
                mode: options.shadowMode || 'open',
            });
        }
        else {
            this.shadowRootInternal = null;
        }
        // Register observed attributes
        if (options.observedAttributes) {
            const observed = this.constructor;
            observed.observedAttributes = options.observedAttributes;
        }
    }
    /**
     * Get observed attributes
     */
    static get observedAttributes() {
        return [];
    }
    /**
     * Called when element is inserted into DOM
     */
    connectedCallback() {
        this.isConnectedInternal = true;
        // Process any queued attribute changes
        this.processAttributeQueue();
        // Call lifecycle hook
        this.safeExecute(() => {
            const result = this.onConnect?.();
            if (result instanceof Promise) {
                result.catch((error) => {
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
    disconnectedCallback() {
        this.isConnectedInternal = false;
        // Call lifecycle hook
        this.safeExecute(() => {
            this.onDisconnect?.();
        });
    }
    /**
     * Called when an observed attribute changes
     */
    attributeChangedCallback(name, oldValue, newValue) {
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
    adoptedCallback() {
        this.safeExecute(() => {
            this.onAdopted?.();
        });
    }
    /**
     * Process queued attribute changes
     */
    processAttributeQueue() {
        for (const change of this.attributeChangeQueue) {
            this.processAttributeChange(change.name, change.oldValue, change.newValue);
        }
        this.attributeChangeQueue = [];
    }
    /**
     * Process a single attribute change
     */
    processAttributeChange(name, oldValue, newValue) {
        this.safeExecute(() => {
            this.onAttributeChange?.(name, oldValue, newValue);
        });
    }
    /**
     * Safely execute a function with error handling
     */
    safeExecute(fn) {
        try {
            return fn();
        }
        catch (error) {
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
    async safeExecuteAsync(fn) {
        try {
            return await fn();
        }
        catch (error) {
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
    handleError(error, context) {
        const errorContext = {
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
    async handleErrorAsync(error, context) {
        const errorContext = {
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
    getAttr(name) {
        return this.getAttribute(name);
    }
    /**
     * Get attribute value or default
     */
    getAttrOrDefault(name, defaultValue) {
        return this.getAttribute(name) || defaultValue;
    }
    /**
     * Check if attribute exists
     */
    hasAttr(name) {
        return this.hasAttribute(name);
    }
    /**
     * Set attribute safely
     */
    setAttr(name, value) {
        if (value === null) {
            this.removeAttribute(name);
        }
        else {
            this.setAttribute(name, value);
        }
    }
    /**
     * Get boolean attribute
     */
    getBoolAttr(name) {
        return this.hasAttribute(name);
    }
    /**
     * Set boolean attribute
     */
    setBoolAttr(name, value) {
        if (value) {
            this.setAttribute(name, '');
        }
        else {
            this.removeAttribute(name);
        }
    }
    /**
     * Dispatch a custom event
     */
    dispatch(eventName, detail, bubbles = true, cancelable = true) {
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
    query(selector) {
        if (this.shadowRootInternal) {
            return this.shadowRootInternal.querySelector(selector);
        }
        return super.querySelector(selector);
    }
    /**
     * Query selector all within component
     */
    queryAll(selector) {
        if (this.shadowRootInternal) {
            return this.shadowRootInternal.querySelectorAll(selector);
        }
        return super.querySelectorAll(selector);
    }
    /**
     * Render content to shadow root or element
     */
    render(html) {
        if (this.shadowRootInternal) {
            this.shadowRootInternal.innerHTML = html;
        }
        else {
            this.innerHTML = html;
        }
    }
}
//# sourceMappingURL=base-component.js.map