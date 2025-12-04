/**
 * Warmthly Head Web Component
 * Generates the entire <head> section with all common meta tags, favicons, etc.
 * Uses global config for all paths and references.
 * 
 * Usage:
 * <warmthly-head 
 *   title="Page Title"
 *   description="Page description"
 *   app="mint" 
 *   viewport="1.0"
 *   preconnects="https://www.warmthly.org, https://post.warmthly.org"
 *   image="https://www.warmthly.org/og-image.jpg"
 *   type="website">
 * </warmthly-head>
 */

import { WARMTHLY_CONFIG } from '../config/warmthly-config.js';

class WarmthlyHead extends HTMLElement {
  async connectedCallback() {
    const title = this.getAttribute('title') || 'Warmthly';
    const description = this.getAttribute('description') || 'Warmthly - Transparent charity tracking and donation platform';
    const app = this.getAttribute('app') || 'main'; // main, mint, post, admin
    const viewport = this.getAttribute('viewport') || '0.75';
    const preconnects = this.getAttribute('preconnects') || '';
    const robots = this.getAttribute('robots') || '';
    const image = this.getAttribute('image') || `${WARMTHLY_CONFIG.urls.main}/global/images/og-default.jpg`;
    const type = this.getAttribute('type') || 'website';
    const canonical = this.getAttribute('canonical') || window.location.href;
    
    // Get current URL for Open Graph
    const currentUrl = canonical;
    const siteName = 'Warmthly';
    
    // Get paths from config
    const stylesPath = WARMTHLY_CONFIG.paths.styles;
    
    // Determine which CSS to load
    const cssFiles = {
      main: ['common.css'],
      mint: ['common.css', 'mint.css'],
      post: ['common.css', 'post.css'],
      admin: ['common.css', 'admin.css']
    };
    
    const cssLinks = cssFiles[app]?.map(css => 
      `  <link rel="stylesheet" href="${stylesPath}/${css}">`
    ).join('\n') || '';
    
    // Build preconnect links
    const preconnectLinks = preconnects.split(',').filter(Boolean).map(domain =>
      `  <link rel="preconnect" href="${domain.trim()}" crossorigin>`
    ).join('\n');
    
    // Robots meta tag (if specified)
    const robotsMeta = robots ? `  <meta name="robots" content="${robots}">\n` : '';
    
    // Structured Data (JSON-LD)
    const structuredData = {
      "@context": "https://schema.org",
      "@type": "Organization",
      "name": "Warmthly",
      "url": WARMTHLY_CONFIG.urls.main,
      "logo": `${WARMTHLY_CONFIG.urls.main}/favicon.svg`,
      "description": description,
      "sameAs": []
    };
    
    this.innerHTML = `
  <meta charset="UTF-8" />
  <meta name="theme-color" content="#fff6f1" />
  <meta name="color-scheme" content="light" />
  <meta name="viewport" content="width=device-width, initial-scale=${viewport}, maximum-scale=5.0, user-scalable=yes" />
  <meta name="format-detection" content="telephone=no" />
  
  <!-- Primary Meta Tags -->
  <title>${this.escapeHtml(title)}</title>
  <meta name="title" content="${this.escapeHtml(title)}" />
  <meta name="description" content="${this.escapeHtml(description)}" />
  <meta name="author" content="Warmthly" />
  <meta name="language" content="en" />
  <link rel="canonical" href="${canonical}" />
${robotsMeta}
  <!-- Open Graph / Facebook -->
  <meta property="og:type" content="${type}" />
  <meta property="og:url" content="${currentUrl}" />
  <meta property="og:title" content="${this.escapeHtml(title)}" />
  <meta property="og:description" content="${this.escapeHtml(description)}" />
  <meta property="og:image" content="${image}" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:image:alt" content="${this.escapeHtml(title)}" />
  <meta property="og:site_name" content="${siteName}" />
  <meta property="og:locale" content="en_US" />
  
  <!-- Twitter -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:url" content="${currentUrl}" />
  <meta name="twitter:title" content="${this.escapeHtml(title)}" />
  <meta name="twitter:description" content="${this.escapeHtml(description)}" />
  <meta name="twitter:image" content="${image}" />
  <meta name="twitter:image:alt" content="${this.escapeHtml(title)}" />
  
  <!-- Additional SEO -->
  <meta name="apple-mobile-web-app-capable" content="yes" />
  <meta name="apple-mobile-web-app-status-bar-style" content="default" />
  <meta name="apple-mobile-web-app-title" content="${siteName}" />
  <meta name="mobile-web-app-capable" content="yes" />
  
${preconnectLinks ? `  <!-- Preconnect to essential domains for faster resource loading -->\n${preconnectLinks}\n` : ''}
  <!-- Emoji Favicon (SVG) - Candle 🕯️ -->
  <link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🕯️</text></svg>">
  <link rel="apple-touch-icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🕯️</text></svg>">
  <link rel="manifest" href="/manifest.json">

  <!-- Preload critical fonts to prevent font flash -->
  <link rel="preload" href="${WARMTHLY_CONFIG.fonts.inter}" as="font" type="font/ttf" crossorigin="anonymous">
  <link rel="preload" href="${WARMTHLY_CONFIG.fonts.cormorant}" as="font" type="font/ttf" crossorigin="anonymous">

  <!-- Shared CSS -->
${cssLinks}
  
  <!-- Structured Data -->
  <script type="application/ld+json">
${JSON.stringify(structuredData, null, 2)}
  </script>
`;
  }
  
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

customElements.define('warmthly-head', WarmthlyHead);

