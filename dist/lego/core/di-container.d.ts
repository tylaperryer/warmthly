/**
 * Dependency Injection Container
 * Provides service registration and resolution for better testability and modularity
 * Implements a simple, type-safe DI container pattern
 */
/**
 * Service identifier type
 */
type ServiceIdentifier<T = unknown> = string | symbol | (new (...args: unknown[]) => T);
/**
 * Service factory function type
 */
type ServiceFactory<T> = (container: DIContainer) => T;
/**
 * Service registration options
 */
interface ServiceRegistration<T> {
    readonly factory: ServiceFactory<T>;
    readonly singleton?: boolean;
}
/**
 * Dependency Injection Container
 * Manages service registration and resolution
 */
declare class DIContainer {
    private readonly services;
    private readonly singletons;
    /**
     * Register a service
     *
     * @param identifier - Service identifier (string, symbol, or class)
     * @param factory - Factory function that creates the service
     * @param singleton - Whether to create a singleton instance
     */
    register<T>(identifier: ServiceIdentifier<T>, factory: ServiceFactory<T>, singleton?: boolean): void;
    /**
     * Resolve a service
     *
     * @param identifier - Service identifier
     * @returns Service instance
     * @throws Error if service is not registered
     */
    resolve<T>(identifier: ServiceIdentifier<T>): T;
    /**
     * Check if a service is registered
     *
     * @param identifier - Service identifier
     * @returns True if service is registered
     */
    has(identifier: ServiceIdentifier): boolean;
    /**
     * Clear all services (useful for testing)
     */
    clear(): void;
}
/**
 * Get or create the global container
 *
 * @returns Global DI container instance
 */
export declare function getContainer(): DIContainer;
/**
 * Create a new container instance (for testing)
 *
 * @returns New DI container instance
 */
export declare function createContainer(): DIContainer;
/**
 * Reset the global container (for testing)
 */
export declare function resetContainer(): void;
export { DIContainer };
export type { ServiceIdentifier, ServiceFactory, ServiceRegistration };
//# sourceMappingURL=di-container.d.ts.map