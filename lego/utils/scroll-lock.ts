/**
 * Scroll Lock Utility
 * Manages body scroll locking for modals and overlays
 * Includes special handling for Yoco payment integration
 * Provides safe scroll restoration and cleanup
 */

/**
 * Saved scroll position
 * Stores scroll position before locking
 */
let savedScrollPosition = 0;

/**
 * Yoco style selectors
 * Used to detect and remove Yoco-injected styles
 */
const YOCO_STYLE_SELECTORS = [
  '#yc-injected-styles',
  'style[id*="yoco" i]',
  'style[id*="yc-" i]',
  'style[class*="yoco" i]',
] as const;

/**
 * Combined Yoco style selector
 */
const YOCO_STYLE_SELECTOR_STRING = YOCO_STYLE_SELECTORS.join(', ');

/**
 * Scroll unlock delay (milliseconds)
 * Allows DOM to update before restoring scroll
 */
const SCROLL_UNLOCK_DELAY = 100;

/**
 * Scroll unlock timeout (milliseconds)
 * Final cleanup timeout
 */
const SCROLL_UNLOCK_TIMEOUT = 300;

/**
 * Yoco style checker interval (milliseconds)
 */
const YOCO_STYLE_CHECK_INTERVAL = 500;

/**
 * Yoco style checker timeout (milliseconds)
 * Stops checking after this time
 */
const YOCO_STYLE_CHECK_TIMEOUT = 30000;

/**
 * Lock body scroll
 * Prevents scrolling while modal/overlay is open
 * Saves current scroll position for restoration
 * 
 * @returns Saved scroll position, or 0 if locking failed
 * 
 * @example
 * ```typescript
 * const savedPosition = lockBodyScroll();
 * // Later, restore scroll:
 * window.scrollTo(0, savedPosition);
 * ```
 */
export function lockBodyScroll(): number {
  // Safety check for browser environment
  if (typeof document === 'undefined' || typeof window === 'undefined') {
    return 0;
  }

  try {
    // Save current scroll position
    savedScrollPosition =
      window.scrollY || document.documentElement.scrollTop || document.body.scrollTop || 0;

    // Add modal-open class
    document.body.classList.add('modal-open');

    // Lock scroll with fixed positioning
    document.body.style.position = 'fixed';
    document.body.style.top = `-${savedScrollPosition}px`;
    document.body.style.width = '100%';
    document.body.style.overflow = 'hidden';

    return savedScrollPosition;
  } catch (error: unknown) {
    // Log error in development
    if (import.meta.env.DEV) {
      console.warn('Failed to lock body scroll:', error);
    }
    return 0;
  }
}

/**
 * Force unlock scroll
 * Aggressively removes all scroll locks and Yoco styles
 * Restores scroll position
 */
export function forceUnlockScroll(): void {
  // Safety check for browser environment
  if (typeof document === 'undefined' || typeof window === 'undefined') {
    return;
  }

  try {
    // Remove Yoco-injected styles
    const yocoStyles = document.querySelectorAll<HTMLStyleElement>(YOCO_STYLE_SELECTOR_STRING);
    yocoStyles.forEach((styleTag) => {
      styleTag.remove();
    });

    // Remove modal classes
    document.body.classList.remove('modal-open', 'yoco-active');
    document.documentElement.classList.remove('modal-open', 'yoco-active');

    // Add unlock classes
    document.body.classList.add('force-scroll-unlock', 'scroll-unlocked');
    document.documentElement.classList.add('force-scroll-unlock', 'scroll-unlocked');

    // Reset styles on body and html
    const elementsToReset: (HTMLElement | HTMLHtmlElement)[] = [
      document.body,
      document.documentElement,
    ];

    elementsToReset.forEach((el) => {
      el.style.position = '';
      el.style.top = '';
      el.style.left = '';
      el.style.width = '';
      el.style.height = '';
      el.style.overflow = '';
      el.style.overflowX = '';
      el.style.overflowY = '';
    });

    // Force reflow
    void document.body.offsetHeight;

    // Restore scroll position
    if (savedScrollPosition > 0) {
      window.scrollTo(0, savedScrollPosition);
      savedScrollPosition = 0;
    }

    // Cleanup unlock classes after delay
    setTimeout(() => {
      document.body.classList.remove('force-scroll-unlock');
      document.documentElement.classList.remove('force-scroll-unlock');
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    }, SCROLL_UNLOCK_DELAY);

    // Final cleanup
    setTimeout(() => {
      // Remove any remaining modal classes
      if (
        document.body.classList.contains('modal-open') ||
        document.body.classList.contains('yoco-active')
      ) {
        document.body.classList.remove('modal-open', 'yoco-active');
        document.documentElement.classList.remove('modal-open', 'yoco-active');
      }

      // Restore scroll if still at top
      const currentScroll = window.scrollY || 0;
      if (currentScroll === 0 && savedScrollPosition > 0) {
        window.scrollTo(0, savedScrollPosition);
      }
    }, SCROLL_UNLOCK_TIMEOUT);
  } catch (error: unknown) {
    // Fallback: aggressive cleanup
    if (import.meta.env.DEV) {
      console.warn('Error in forceUnlockScroll, attempting fallback cleanup:', error);
    }

    try {
      // Remove classes with regex fallback
      document.body.className = document.body.className.replace(/modal-open|yoco-active/g, '').trim();
      document.body.style.cssText = '';
      document.documentElement.style.cssText = '';
    } catch {
      // Last resort: do nothing
    }
  }
}

/**
 * Cleanup Yoco payment state
 * Removes Yoco elements and unlocks scroll
 */
export function cleanupYocoState(): void {
  // Safety check for browser environment
  if (typeof document === 'undefined') {
    return;
  }

  try {
    forceUnlockScroll();

    // Reset Yoco payment UI elements
    const donateButton = document.getElementById('donateButton');
    const yocoPaymentEmbed = document.getElementById('yocoPaymentEmbed');
    const yocoEmbedContainer = document.getElementById('yocoEmbedContainer');

    if (donateButton instanceof HTMLElement) {
      donateButton.style.display = 'inline-block';
    }

    if (yocoPaymentEmbed instanceof HTMLElement) {
      yocoPaymentEmbed.style.display = 'none';
    }

    if (yocoEmbedContainer instanceof HTMLElement) {
      yocoEmbedContainer.innerHTML = '';
    }
  } catch (error: unknown) {
    // Fallback: just unlock scroll
    if (import.meta.env.DEV) {
      console.warn('Error in cleanupYocoState:', error);
    }
    forceUnlockScroll();
  }
}

/**
 * Initialize Yoco style observer
 * Monitors and removes Yoco-injected styles that interfere with scroll locking
 * Runs for a limited time to avoid performance impact
 */
export function initYocoStyleObserver(): void {
  // Safety check for browser environment
  if (typeof document === 'undefined' || typeof MutationObserver === 'undefined') {
    return;
  }

  try {
    /**
     * Mutation observer for Yoco styles
     * Removes Yoco-injected styles as soon as they're added
     */
    const yocoStyleObserver = new MutationObserver((mutations: MutationRecord[]) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE && node instanceof HTMLStyleElement) {
              const isYocoStyle =
                node.id === 'yc-injected-styles' ||
                (node.id && node.id.toLowerCase().includes('yoco')) ||
                (node.className && typeof node.className === 'string' && node.className.toLowerCase().includes('yoco')) ||
                (node.textContent && node.textContent.toLowerCase().includes('yoco'));

              if (isYocoStyle) {
                node.remove();
                // Unlock scroll after removing style
                setTimeout(() => {
                  forceUnlockScroll();
                }, 50);
              }
            }
          });
        }
      });
    });

    // Observe document head and body for style additions
    yocoStyleObserver.observe(document.head, { childList: true, subtree: true });
    yocoStyleObserver.observe(document.body, { childList: true, subtree: true });

    /**
     * Periodic style checker
     * Fallback to catch styles that mutation observer might miss
     */
    const yocoStyleChecker = window.setInterval(() => {
      const yocoStyles = document.querySelectorAll<HTMLStyleElement>(
        '#yc-injected-styles, style[id*="yoco" i], style[id*="yc-" i]'
      );

      if (yocoStyles.length > 0) {
        yocoStyles.forEach((style) => style.remove());
        forceUnlockScroll();
      }
    }, YOCO_STYLE_CHECK_INTERVAL);

    // Stop checking after timeout
    setTimeout(() => {
      window.clearInterval(yocoStyleChecker);
      yocoStyleObserver.disconnect();
    }, YOCO_STYLE_CHECK_TIMEOUT);
  } catch (error: unknown) {
    // Log error in development
    if (import.meta.env.DEV) {
      console.warn('Failed to initialize Yoco style observer:', error);
    }
  }
}

