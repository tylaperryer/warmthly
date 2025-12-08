/**
 * Stoplight Menu Utilities
 * Provides accessible dropdown menu functionality with keyboard navigation
 * Implements ARIA menu pattern and WCAG 2.1 keyboard navigation requirements
 */

/**
 * Focus trap cleanup function type
 * Extends window interface for global trapFocus function
 */
interface WindowWithTrapFocus extends Window {
  trapFocus?: (element: HTMLElement) => (() => void) | undefined;
}

/**
 * Menu item element type
 */
type MenuItem = HTMLAnchorElement | HTMLButtonElement;

/**
 * Initialize stoplight menu component
 * Sets up accessible dropdown menu with full keyboard navigation
 *
 * @param stoplightId - ID of the stoplight button element (default: 'stoplight')
 * @param menuId - ID of the dropdown menu element (default: 'dropdown-menu')
 *
 * @example
 * ```typescript
 * initStoplight('my-stoplight', 'my-menu');
 * ```
 */
export function initStoplight(stoplightId = 'stoplight', menuId = 'dropdown-menu'): void {
  // Safety check for browser environment
  if (typeof document === 'undefined') {
    return;
  }

  const stoplightElement = document.getElementById(stoplightId);
  const dropdownMenuElement = document.getElementById(menuId);

  // Validate elements exist
  if (!stoplightElement || !dropdownMenuElement) {
    if (import.meta.env.DEV) {
      console.warn(
        `Stoplight initialization failed: elements not found (stoplight: ${stoplightId}, menu: ${menuId})`
      );
    }
    return;
  }

  // Ensure elements are correct types
  if (!(stoplightElement instanceof HTMLElement) || !(dropdownMenuElement instanceof HTMLElement)) {
    if (import.meta.env.DEV) {
      console.warn('Stoplight initialization failed: invalid element types');
    }
    return;
  }

  // At this point, TypeScript knows these are non-null HTMLElements
  const stoplight: HTMLElement = stoplightElement;
  const dropdownMenu: HTMLElement = dropdownMenuElement;

  let isOpen = false;
  let currentFocusIndex = -1;
  const menuItems: MenuItem[] = Array.from(dropdownMenu.querySelectorAll<MenuItem>('a, button'));

  /**
   * Toggle menu open/closed state
   */
  function toggleMenu(): void {
    isOpen = !isOpen;
    dropdownMenu.setAttribute('aria-hidden', String(!isOpen));
    stoplight.setAttribute('aria-expanded', String(isOpen));

    if (isOpen) {
      // Focus first menu item when opening
      if (menuItems.length > 0) {
        currentFocusIndex = 0;
        menuItems[0]?.focus();
      }

      // Trap focus within menu
      const windowWithTrapFocus = window as WindowWithTrapFocus;
      if (windowWithTrapFocus.trapFocus) {
        windowWithTrapFocus.trapFocus(dropdownMenu);
      }
    } else {
      // Return focus to stoplight button when closing
      stoplight.focus();
      currentFocusIndex = -1;
    }
  }

  /**
   * Close menu
   */
  function closeMenu(): void {
    if (isOpen) {
      isOpen = false;
      dropdownMenu.setAttribute('aria-hidden', 'true');
      stoplight.setAttribute('aria-expanded', 'false');
      stoplight.focus();
      currentFocusIndex = -1;
    }
  }

  /**
   * Handle keyboard navigation
   */
  function handleKeyDown(event: KeyboardEvent): void {
    if (!isOpen && event.key === 'Enter') {
      // Open menu on Enter
      event.preventDefault();
      toggleMenu();
      return;
    }

    if (!isOpen) {
      return;
    }

    switch (event.key) {
      case 'Escape':
        event.preventDefault();
        closeMenu();
        break;

      case 'ArrowDown':
        event.preventDefault();
        currentFocusIndex = (currentFocusIndex + 1) % menuItems.length;
        menuItems[currentFocusIndex]?.focus();
        break;

      case 'ArrowUp':
        event.preventDefault();
        currentFocusIndex = currentFocusIndex <= 0 ? menuItems.length - 1 : currentFocusIndex - 1;
        menuItems[currentFocusIndex]?.focus();
        break;

      case 'Home':
        event.preventDefault();
        currentFocusIndex = 0;
        menuItems[0]?.focus();
        break;

      case 'End':
        event.preventDefault();
        currentFocusIndex = menuItems.length - 1;
        menuItems[currentFocusIndex]?.focus();
        break;

      case 'Tab':
        // Allow Tab to work normally but close menu
        if (!event.shiftKey && currentFocusIndex === menuItems.length - 1) {
          closeMenu();
        }
        break;
    }
  }

  /**
   * Handle click outside menu to close
   */
  function handleClickOutside(event: MouseEvent): void {
    const target = event.target as Node;
    if (isOpen && !dropdownMenu.contains(target) && !stoplight.contains(target)) {
      closeMenu();
    }
  }

  // Set initial ARIA attributes
  stoplight.setAttribute('aria-haspopup', 'true');
  stoplight.setAttribute('aria-expanded', 'false');
  stoplight.setAttribute('aria-controls', menuId);
  dropdownMenu.setAttribute('aria-hidden', 'true');
  dropdownMenu.setAttribute('role', 'menu');

  // Set role for menu items
  menuItems.forEach(item => {
    item.setAttribute('role', 'menuitem');
    item.setAttribute('tabindex', '-1');

    // Close menu when item is clicked
    item.addEventListener('click', () => {
      closeMenu();
    });
  });

  // Event listeners
  stoplight.addEventListener('click', event => {
    event.preventDefault();
    toggleMenu();
  });

  stoplight.addEventListener('keydown', handleKeyDown);
  dropdownMenu.addEventListener('keydown', handleKeyDown);

  // Close menu when clicking outside
  document.addEventListener('click', handleClickOutside);

  // Close menu on focus loss (accessibility)
  dropdownMenu.addEventListener('focusout', () => {
    // Use setTimeout to check if focus moved outside menu
    setTimeout(() => {
      if (
        isOpen &&
        !dropdownMenu.contains(document.activeElement) &&
        !stoplight.contains(document.activeElement)
      ) {
        closeMenu();
      }
    }, 0);
  });
}
