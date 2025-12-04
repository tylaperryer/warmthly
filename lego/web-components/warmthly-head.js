/**
 * Warmthly Head Web Component
 * Generates the entire <head> section with all common meta tags, favicons, etc.
 * 
 * Usage:
 * <warmthly-head 
 *   title="Page Title"
 *   app="mint" 
 *   viewport="1.0"
 *   preconnects="https://www.warmthly.org, https://post.warmthly.org">
 * </warmthly-head>
 */

class WarmthlyHead extends HTMLElement {
  connectedCallback() {
    const title = this.getAttribute('title') || 'Warmthly';
    const app = this.getAttribute('app') || 'main'; // main, mint, post, admin
    const viewport = this.getAttribute('viewport') || '0.75';
    const preconnects = this.getAttribute('preconnects') || '';
    const robots = this.getAttribute('robots') || ''; // e.g., "noindex, nofollow"
    
    // Determine which CSS to load
    const cssFiles = {
      main: ['common.css'],
      mint: ['common.css', 'mint.css'],
      post: ['common.css', 'post.css'],
      admin: ['common.css', 'admin.css']
    };
    
    const cssLinks = cssFiles[app]?.map(css => 
      `  <link rel="stylesheet" href="/lego/styles/${css}">`
    ).join('\n') || '';
    
    // Build preconnect links
    const preconnectLinks = preconnects.split(',').filter(Boolean).map(domain =>
      `  <link rel="preconnect" href="${domain.trim()}">`
    ).join('\n');
    
    // Robots meta tag (if specified)
    const robotsMeta = robots ? `  <meta name="robots" content="${robots}">\n` : '';
    
    this.innerHTML = `
  <meta charset="UTF-8" />
  <meta name="theme-color" content="#fff6f1" />
  <meta name="color-scheme" content="light" />
  <meta name="viewport" content="width=device-width, initial-scale=${viewport}, user-scalable=yes" />
${robotsMeta}  <title>${title}</title>
${preconnectLinks ? `\n  <!-- Preconnect to essential domains for faster resource loading -->\n${preconnectLinks}\n` : ''}
  <!-- Favicon Set for All Devices -->
  <link rel="icon" type="image/png" sizes="32x32" href="/global/favicon/candle-32.png">
  <link rel="icon" type="image/png" sizes="16x16" href="/global/favicon/candle-16.png">
  <link rel="apple-touch-icon" sizes="180x180" href="/global/favicon/candle-apple.png">

  <!-- Preload critical fonts to prevent font flash -->
  <link rel="preload" href="/fonts/Inter-VariableFont_opsz,wght.ttf" as="font" type="font/ttf" crossorigin>
  <link rel="preload" href="/fonts/CormorantGaramond-VariableFont_wght.ttf" as="font" type="font/ttf" crossorigin>

  <!-- Shared CSS -->
${cssLinks}
`;
  }
}

customElements.define('warmthly-head', WarmthlyHead);

