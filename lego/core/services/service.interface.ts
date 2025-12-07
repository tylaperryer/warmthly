/**
 * Service Interface
 * Base interface for all services in the application
 */

/**
 * Base service interface
 * All services should implement this interface
 */
export interface IService {
  /**
   * Initialize the service
   * Called when service is first created
   */
  initialize?(): Promise<void> | void;

  /**
   * Cleanup the service
   * Called when service is being destroyed
   */
  cleanup?(): Promise<void> | void;
}

/**
 * Service lifecycle hooks
 */
export interface ServiceLifecycle {
  readonly onInit?: () => Promise<void> | void;
  readonly onDestroy?: () => Promise<void> | void;
}

