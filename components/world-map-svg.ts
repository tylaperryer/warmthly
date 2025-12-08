/**
 * World Map SVG Web Component
 * Displays a world map with dots using SVG
 * Uses Shadow DOM for style isolation
 *
 * Usage:
 * <world-map-svg></world-map-svg>
 */

/**
 * SVG paths to try (in order of preference)
 */
const SVG_PATHS: readonly string[] = ['/assets/images/worlddots.svg'] as const;

/**
 * Default SVG viewBox
 */
const DEFAULT_VIEWBOX = '0 0 3129 1736';

/**
 * Dot styling
 */
const DOT_FILL = '#FFB88C';
const DOT_OPACITY = '0.6';

/**
 * World Map SVG Web Component
 * Uses Shadow DOM for encapsulation
 */
class WorldMapSVG extends HTMLElement {
  private svgContainer: HTMLDivElement | null = null;
  private svg: SVGSVGElement | null = null;

  constructor() {
    super();
    // Create shadow DOM
    this.attachShadow({ mode: 'open' });
  }

  /**
   * Called when element is inserted into the DOM
   */
  connectedCallback(): void {
    this.init().catch((error: unknown) => {
      if (import.meta.env.DEV) {
        console.error('Error initializing world-map-svg:', error);
      }
    });
  }

  /**
   * Called when element is removed from the DOM
   */
  disconnectedCallback(): void {
    this.destroy();
  }

  /**
   * Initialize the component
   */
  private async init(): Promise<void> {
    // Safety check for browser environment
    if (typeof document === 'undefined') {
      return;
    }

    this.createContainer();
    await this.loadSVG();
  }

  /**
   * Create container element in shadow DOM
   */
  private createContainer(): void {
    if (!this.shadowRoot) {
      return;
    }

    // Create styles
    const style = document.createElement('style');
    style.textContent = `
      .world-map-svg-container {
        width: 100%;
        max-width: 800px;
        margin: 0 auto;
        padding: 0;
      }
      
      .world-map-svg-container svg {
        display: block;
        width: 100%;
        height: auto;
      }
      
      .dot {
        fill: ${DOT_FILL};
        opacity: ${DOT_OPACITY};
      }
    `;
    this.shadowRoot.appendChild(style);

    // Create container
    const container = document.createElement('div');
    container.className = 'world-map-svg-container';
    this.shadowRoot.appendChild(container);
    this.svgContainer = container;
  }

  /**
   * Load SVG from file
   * Tries multiple paths until one succeeds
   */
  private async loadSVG(): Promise<void> {
    if (!this.svgContainer) {
      return;
    }

    try {
      let svgText: string | null = null;

      // Try each path until one succeeds
      for (const path of SVG_PATHS) {
        try {
          const response = await fetch(path);
          if (response.ok) {
            svgText = await response.text();
            break;
          }
        } catch (error: unknown) {
          // Try next path
          if (import.meta.env.DEV) {
            console.warn(`Failed to load SVG from ${path}:`, error);
          }
        }
      }

      if (!svgText) {
        throw new Error('SVG file not found in any configured path');
      }

      // Inject SVG into container
      this.svgContainer.innerHTML = svgText;
      this.svg = this.svgContainer.querySelector('svg');

      if (!this.svg) {
        throw new Error('SVG element not found in loaded content');
      }

      // Ensure viewBox is set
      if (!this.svg.getAttribute('viewBox')) {
        this.svg.setAttribute('viewBox', DEFAULT_VIEWBOX);
      }

      // Set uniform styling for all circles
      const circles = this.svg.querySelectorAll<SVGCircleElement>('circle');
      circles.forEach(circle => {
        circle.setAttribute('fill', DOT_FILL);
        circle.setAttribute('opacity', DOT_OPACITY);
      });
    } catch (error: unknown) {
      // Error loading SVG - display fallback message
      if (this.svgContainer) {
        this.svgContainer.innerHTML = '<p style="color: red;">Error loading map.</p>';
      }

      if (import.meta.env.DEV) {
        console.error('Error loading SVG:', error);
      }
    }
  }

  /**
   * Cleanup when component is destroyed
   */
  private destroy(): void {
    // Clear references
    this.svgContainer = null;
    this.svg = null;
  }
}

// Register the custom element
customElements.define('world-map-svg', WorldMapSVG);

// Export for potential programmatic use
export { WorldMapSVG };
