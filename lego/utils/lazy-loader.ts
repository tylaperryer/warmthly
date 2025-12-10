/**
 * Lazy Loading Utility
 * Implements lazy loading for components and modules
 * Reduces initial bundle size and improves page load performance
 */

/**
 * Component loading configuration
 */
interface ComponentConfig {
  /** Component name/identifier */
  name: string;
  /** Path to component module */
  path: string;
  /** Whether component is critical (load immediately) */
  critical?: boolean;
  /** Load component when element is visible (IntersectionObserver) */
  loadOnVisible?: boolean;
  /** Load component on specific event */
  loadOnEvent?: string;
  /** Load component after delay (ms) */
  loadAfterDelay?: number;
}

/**
 * Lazy load a component module
 * @param path - Path to the component module
 * @returns Promise that resolves to the component module
 */
export async function lazyLoadComponent(path: string): Promise<unknown> {
  try {
    const module = await import(path);
    return module;
  } catch (error) {
    console.error(`Failed to load component from ${path}:`, error);
    throw error;
  }
}

/**
 * Lazy load component when element becomes visible
 * @param element - Element to observe
 * @param componentPath - Path to component module
 * @returns Promise that resolves when component is loaded
 */
export function lazyLoadOnVisible(element: HTMLElement, componentPath: string): Promise<unknown> {
  return new Promise((resolve, reject) => {
    if (!('IntersectionObserver' in window)) {
      // Fallback: load immediately if IntersectionObserver not supported
      lazyLoadComponent(componentPath).then(resolve).catch(reject);
      return;
    }

    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            observer.disconnect();
            lazyLoadComponent(componentPath).then(resolve).catch(reject);
          }
        });
      },
      {
        rootMargin: '50px', // Start loading 50px before element is visible
      }
    );

    observer.observe(element);
  });
}

/**
 * Lazy load component after delay
 * @param componentPath - Path to component module
 * @param delay - Delay in milliseconds
 * @returns Promise that resolves when component is loaded
 */
export function lazyLoadAfterDelay(componentPath: string, delay: number): Promise<unknown> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      lazyLoadComponent(componentPath).then(resolve).catch(reject);
    }, delay);
  });
}

/**
 * Lazy load component on event
 * @param element - Element to attach event listener to
 * @param event - Event name
 * @param componentPath - Path to component module
 * @returns Promise that resolves when component is loaded
 */
export function lazyLoadOnEvent(
  element: HTMLElement,
  event: string,
  componentPath: string
): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const handler = async () => {
      element.removeEventListener(event, handler);
      try {
        const module = await lazyLoadComponent(componentPath);
        resolve(module);
      } catch (error) {
        reject(error);
      }
    };
    element.addEventListener(event, handler);
  });
}

/**
 * Configure and load components based on configuration
 * @param configs - Array of component configurations
 */
export function configureLazyLoading(configs: ComponentConfig[]): void {
  configs.forEach(config => {
    if (config.critical) {
      // Load critical components immediately
      lazyLoadComponent(config.path).catch(error => {
        console.error(`Failed to load critical component ${config.name}:`, error);
      });
      return;
    }

    if (config.loadOnVisible) {
      const element = document.querySelector(`[data-lazy-load="${config.name}"]`);
      if (element instanceof HTMLElement) {
        lazyLoadOnVisible(element, config.path).catch(error => {
          console.error(`Failed to lazy load ${config.name}:`, error);
        });
      }
    } else if (config.loadOnEvent) {
      const element = document.querySelector(`[data-lazy-load="${config.name}"]`);
      if (element instanceof HTMLElement) {
        lazyLoadOnEvent(element, config.loadOnEvent, config.path).catch(error => {
          console.error(`Failed to lazy load ${config.name} on event:`, error);
        });
      }
    } else if (config.loadAfterDelay) {
      lazyLoadAfterDelay(config.path, config.loadAfterDelay).catch(error => {
        console.error(`Failed to lazy load ${config.name} after delay:`, error);
      });
    }
  });
}
