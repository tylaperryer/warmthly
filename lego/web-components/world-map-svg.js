/**
 * World Map SVG Web Component
 * Displays a world map with dots using SVG
 * 
 * Usage:
 * <world-map-svg></world-map-svg>
 */

class WorldMapSVG extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });

    // State
    this.svgContainer = null;
    this.svg = null;
  }

  // Web Component lifecycle
  connectedCallback() {
    this.init();
  }

  disconnectedCallback() {
    this.destroy();
  }

  async init() {
    this.createContainer();
    await this.loadSVG();
  }

  // Create container element in shadow DOM
  createContainer() {
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
        fill: #FFB88C;
        opacity: 0.6;
      }
    `;
    this.shadowRoot.appendChild(style);
    
    const container = document.createElement('div');
    container.className = 'world-map-svg-container';
    this.shadowRoot.appendChild(container);
    this.svgContainer = container;
  }

  // Load SVG
  async loadSVG() {
    try {
      // Try multiple paths for flexibility
      const paths = [
        '/global/images/worlddots.svg',
        '/worlddots.svg',
        './worlddots.svg',
        'worlddots.svg'
      ];
      let svgText = null;
      
      for (const path of paths) {
        try {
          const response = await fetch(path);
          if (response.ok) {
            svgText = await response.text();
            break;
          }
        } catch (err) {
          // Ignore fetch errors, try next path
        }
      }
      
      if (!svgText) {
        throw new Error('SVG file not found.');
      }
      
      this.svgContainer.innerHTML = svgText;
      this.svg = this.svgContainer.querySelector('svg');
      
      if (!this.svg) {
        throw new Error('SVG element not found in loaded content');
      }
      
      // Ensure viewBox is set (assuming the original 3129x1736 viewBox)
      if (!this.svg.getAttribute('viewBox')) {
        this.svg.setAttribute('viewBox', '0 0 3129 1736');
      }
      
      // Set uniform styling for all circles
      this.svg.querySelectorAll('circle').forEach(circle => {
        circle.setAttribute('fill', '#FFB88C');
        circle.setAttribute('opacity', '0.6');
      });
      
    } catch (error) {
      console.error('Error loading SVG:', error);
      this.svgContainer.innerHTML = '<p style="color: red;">Error loading map.</p>';
    }
  }

  destroy() {
    // Nothing to clean up
  }
}

// Register the component
customElements.define('world-map-svg', WorldMapSVG);

