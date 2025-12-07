/**
 * Focus Trap Utility
 * Traps keyboard focus within a specific DOM element
 * Essential for accessibility in modals, dialogs, and dropdowns
 * Implements WCAG 2.1 keyboard navigation requirements
 */

/**
 * Cleanup function type for focus trap
 */
export type FocusTrapCleanup = () => void;

/**
 * Focusable element selectors
 * Matches all elements that can receive keyboard focus
 */
const FOCUSABLE_SELECTORS = [
  'a[href]',
  'button:not([disabled])',
  'textarea:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
] as const;

/**
 * Combined focusable selector string
 */
const FOCUSABLE_SELECTOR_STRING = FOCUSABLE_SELECTORS.join(', ');

/**
 * Check if an element is visible
 * @param element - Element to check
 * @returns True if element is visible, false otherwise
 */
function isElementVisible(element: Element): boolean {
  if (typeof window === 'undefined' || typeof window.getComputedStyle === 'undefined') {
    // Fallback: assume visible if getComputedStyle unavailable
    return true;
  }

  try {
    const style = window.getComputedStyle(element);
    return style.display !== 'none' && style.visibility !== 'hidden';
  } catch {
    // If getComputedStyle fails, assume visible
    return true;
  }
}

/**
 * Get all focusable elements within a container
 * @param container - Container element to search within
 * @returns Array of focusable elements
 */
function getFocusableElements(container: HTMLElement): HTMLElement[] {
  // Safety check for browser environment
  if (typeof document === 'undefined' || typeof window === 'undefined') {
    return [];
  }

  try {
    const allFocusable = Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR_STRING));
    return allFocusable.filter(isElementVisible);
  } catch {
    // If querySelector fails, return empty array
    return [];
  }
}

/**
 * Trap keyboard focus within an element
 * Prevents focus from escaping the element (e.g., in modals)
 * 
 * @param element - Element to trap focus within
 * @returns Cleanup function to remove the focus trap
 * 
 * @example
 * ```typescript
 * const cleanup = trapFocus(modalElement);
 * // Later, when modal closes:
 * cleanup();
 * ```
 */
export function trapFocus(element: HTMLElement | null): FocusTrapCleanup {
  // Return no-op function if element is invalid
  if (!element || typeof document === 'undefined') {
    return (): void => {
      // No-op cleanup function
    };
  }

  /**
   * Handle Tab key navigation
   * Cycles focus within the trap
   */
  const handleTab = (event: KeyboardEvent): void => {
    // Only handle Tab key
    if (event.key !== 'Tab') {
      return;
    }

    const focusableElements = getFocusableElements(element);

    // If no focusable elements, prevent default tab behavior
    if (focusableElements.length === 0) {
      event.preventDefault();
      return;
    }

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    // Handle Shift+Tab (backward navigation)
    if (event.shiftKey) {
      if (document.activeElement === firstElement || !element.contains(document.activeElement)) {
        event.preventDefault();
        lastElement.focus();
      }
    } else {
      // Handle Tab (forward navigation)
      if (document.activeElement === lastElement || !element.contains(document.activeElement)) {
        event.preventDefault();
        firstElement.focus();
      }
    }
  };

  // Add event listener
  element.addEventListener('keydown', handleTab);

  // Return cleanup function
  return (): void => {
    element.removeEventListener('keydown', handleTab);
  };
}

