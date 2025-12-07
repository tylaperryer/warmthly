/**
 * ARIA Announcer
 * Provides accessible screen reader announcements
 * Implements WCAG 2.1 AA standards for live regions
 */

/**
 * ARIA live region priority levels
 */
type AriaLivePriority = 'polite' | 'assertive' | 'off';

/**
 * ARIA Announcer class
 * Manages screen reader announcements through a live region
 */
class AriaAnnouncer {
  private announcer: HTMLDivElement | null = null;
  private readonly announcerId = 'aria-announcer';
  private clearTimeoutId: number | null = null;

  /**
   * Initialize the ARIA announcer element
   * Creates a screen reader-only live region if it doesn't exist
   */
  private init(): void {
    // Safety check for browser environment
    if (typeof document === 'undefined') {
      return;
    }

    // Return if already initialized
    if (this.announcer) {
      return;
    }

    // Check if announcer already exists in DOM
    const existing = document.getElementById(this.announcerId);
    if (existing instanceof HTMLDivElement) {
      this.announcer = existing;
      return;
    }

    // Create new announcer element
    this.announcer = document.createElement('div');
    this.announcer.setAttribute('role', 'status');
    this.announcer.setAttribute('aria-live', 'polite');
    this.announcer.setAttribute('aria-atomic', 'true');
    this.announcer.className = 'sr-only';
    this.announcer.id = this.announcerId;

    // Ensure body exists before appending
    if (document.body) {
      document.body.appendChild(this.announcer);
    } else {
      // Wait for DOM to be ready
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
          if (document.body && this.announcer) {
            document.body.appendChild(this.announcer);
          }
        });
      }
    }
  }

  /**
   * Announce a message to screen readers
   * @param message - Message to announce (will be sanitized)
   * @param priority - Priority level: 'polite' (default) or 'assertive'
   */
  announce(message: string, priority: AriaLivePriority = 'polite'): void {
    // Validate input
    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return;
    }

    // Initialize if needed
    if (!this.announcer) {
      this.init();
    }

    if (!this.announcer) {
      // Still couldn't initialize, log warning in development
      if (import.meta.env.DEV) {
        console.warn('ARIA announcer could not be initialized');
      }
      return;
    }

    // Clear any pending timeout
    if (this.clearTimeoutId !== null) {
      window.clearTimeout(this.clearTimeoutId);
      this.clearTimeoutId = null;
    }

    // Set priority and announce message
    this.announcer.setAttribute('aria-live', priority);
    // Use textContent for safety (prevents XSS)
    this.announcer.textContent = message.trim();

    // Clear message after announcement is read
    // Screen readers typically read within 1 second
    this.clearTimeoutId = window.setTimeout(() => {
      if (this.announcer) {
        this.announcer.textContent = '';
      }
      this.clearTimeoutId = null;
    }, 1000);
  }

  /**
   * Get the announcer element (for testing purposes)
   * @internal
   */
  getAnnouncerElement(): HTMLDivElement | null {
    return this.announcer;
  }
}

/**
 * Singleton instance of ARIA announcer
 * Export for use throughout the application
 */
export const ariaAnnouncer = new AriaAnnouncer();

