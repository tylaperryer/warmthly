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
class DIContainer {
  private readonly services = new Map<ServiceIdentifier, ServiceRegistration<unknown>>();
  private readonly singletons = new Map<ServiceIdentifier, unknown>();

  /**
   * Register a service
   *
   * @param identifier - Service identifier (string, symbol, or class)
   * @param factory - Factory function that creates the service
   * @param singleton - Whether to create a singleton instance
   */
  register<T>(
    identifier: ServiceIdentifier<T>,
    factory: ServiceFactory<T>,
    singleton = false
  ): void {
    this.services.set(identifier, { factory, singleton });
  }

  /**
   * Resolve a service
   *
   * @param identifier - Service identifier
   * @returns Service instance
   * @throws Error if service is not registered
   */
  resolve<T>(identifier: ServiceIdentifier<T>): T {
    const registration = this.services.get(identifier);

    if (!registration) {
      throw new Error(`Service not registered: ${String(identifier)}`);
    }

    // Return singleton if exists
    if (registration.singleton) {
      if (this.singletons.has(identifier)) {
        return this.singletons.get(identifier) as T;
      }
    }

    // Create new instance
    const instance = registration.factory(this) as T;

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
  has(identifier: ServiceIdentifier): boolean {
    return this.services.has(identifier);
  }

  /**
   * Clear all services (useful for testing)
   */
  clear(): void {
    this.services.clear();
    this.singletons.clear();
  }
}

/**
 * Global container instance
 */
let globalContainer: DIContainer | null = null;

/**
 * Get or create the global container
 *
 * @returns Global DI container instance
 */
export function getContainer(): DIContainer {
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
export function createContainer(): DIContainer {
  return new DIContainer();
}

/**
 * Reset the global container (for testing)
 */
export function resetContainer(): void {
  globalContainer = null;
}

export { DIContainer };
export type { ServiceIdentifier, ServiceFactory, ServiceRegistration };
