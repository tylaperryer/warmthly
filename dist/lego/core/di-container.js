/**
 * Dependency Injection Container
 * Provides service registration and resolution for better testability and modularity
 * Implements a simple, type-safe DI container pattern
 */
/**
 * Dependency Injection Container
 * Manages service registration and resolution
 */
class DIContainer {
    services = new Map();
    singletons = new Map();
    /**
     * Register a service
     *
     * @param identifier - Service identifier (string, symbol, or class)
     * @param factory - Factory function that creates the service
     * @param singleton - Whether to create a singleton instance
     */
    register(identifier, factory, singleton = false) {
        this.services.set(identifier, { factory, singleton });
    }
    /**
     * Resolve a service
     *
     * @param identifier - Service identifier
     * @returns Service instance
     * @throws Error if service is not registered
     */
    resolve(identifier) {
        const registration = this.services.get(identifier);
        if (!registration) {
            throw new Error(`Service not registered: ${String(identifier)}`);
        }
        // Return singleton if exists
        if (registration.singleton) {
            if (this.singletons.has(identifier)) {
                return this.singletons.get(identifier);
            }
        }
        // Create new instance
        const instance = registration.factory(this);
        // Store singleton if needed
        if (registration.singleton) {
            this.singletons.set(identifier, instance);
        }
        return instance;
    }
    /**
     * Check if a service is registered
     *
     * @param identifier - Service identifier
     * @returns True if service is registered
     */
    has(identifier) {
        return this.services.has(identifier);
    }
    /**
     * Clear all services (useful for testing)
     */
    clear() {
        this.services.clear();
        this.singletons.clear();
    }
}
/**
 * Global container instance
 */
let globalContainer = null;
/**
 * Get or create the global container
 *
 * @returns Global DI container instance
 */
export function getContainer() {
    if (!globalContainer) {
        globalContainer = new DIContainer();
    }
    return globalContainer;
}
/**
 * Create a new container instance (for testing)
 *
 * @returns New DI container instance
 */
export function createContainer() {
    return new DIContainer();
}
/**
 * Reset the global container (for testing)
 */
export function resetContainer() {
    globalContainer = null;
}
export { DIContainer };
//# sourceMappingURL=di-container.js.map