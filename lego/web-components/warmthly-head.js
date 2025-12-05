import { WARMTHLY_CONFIG } from '../config/warmthly-config.js';

class WarmthlyHead extends HTMLElement {
  async connectedCallback() {
    const title = this.getAttribute('title') || 'Warmthly';
    const description = this.getAttribute('description') || 'Warmthly - Rehumanize our world - making empathy a measurable part of our systems';
    const app = this.getAttribute('app') || 'main';
    const viewport = this.getAttribute('viewport') || '0.75';
    const preconnects = this.getAttribute('preconnects') || '';
    const robots = this.getAttribute('robots') || '';
    const image = this.getAttribute('image') || `${WARMTHLY_CONFIG.urls.main}${WARMTHLY_CONFIG.favicon}`;
    const type = this.getAttribute('type') || 'website';
    const canonical = this.getAttribute('canonical') || window.location.href;
    
    const currentUrl = canonical;
    const siteName = 'Warmthly';
    const stylesPath = WARMTHLY_CONFIG.paths.styles;
    
    const cssFiles = {
      main: ['common.css'],
      mint: ['common.css', 'mint.css'],
      post: ['common.css', 'post.css'],
      admin: ['common.css', 'admin.css']
    };
    
    const appCssFiles = cssFiles[app] || ['common.css'];
    
    // Preload CSS files for faster loading
    const cssPreloadLinks = appCssFiles.map(css => 
      `  <link rel="preload" href="${stylesPath}/${css}" as="style">`
    ).join('\n');
    
    const cssLinks = appCssFiles.map(css => 
      `  <link rel="stylesheet" href="${stylesPath}/${css}">`
    ).join('\n') || '';
    
    const preconnectLinks = preconnects.split(',').filter(Boolean).map(domain =>
      `  <link rel="preconnect" href="${domain.trim()}" crossorigin>`
    ).join('\n');
    
    const robotsMeta = robots ? `  <meta name="robots" content="${robots}">\n` : '';
    
    const structuredData = {
      "@context": "https://schema.org",
      "@type": "Organization",
      "name": "Warmthly",
      "url": WARMTHLY_CONFIG.urls.main,
      "logo": `${WARMTHLY_CONFIG.urls.main}${WARMTHLY_CONFIG.favicon}`,
      "description": "Rehumanize our world - making empathy a measurable part of our systems",
      "sameAs": []
    };
    
    const temp = document.createElement('div');
    temp.innerHTML = `
  <meta charset="UTF-8" />
  <meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com https://js.yoco.com https://js.verygoodvault.com https://www.gstatic.com; style-src 'self' 'unsafe-inline' https://cdn.quilljs.com; font-src 'self' data:; img-src 'self' data: https: blob:; connect-src 'self' https://api.airtable.com https://payments.yoco.com https://online.yoco.com https://verygoodvault.com https://api.exchangerate-api.com https://www.googleapis.com https://*.firebaseio.com https://*.firestore.googleapis.com; frame-src 'self' https://js.yoco.com https://js.verygoodvault.com; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'; upgrade-insecure-requests; block-all-mixed-content;" />
  <meta http-equiv="X-Content-Type-Options" content="nosniff" />
  <meta http-equiv="X-Frame-Options" content="DENY" />
  <meta http-equiv="Referrer-Policy" content="no-referrer" />
  <meta name="theme-color" content="#fff6f1" />
  <meta name="color-scheme" content="light" />
  <meta name="viewport" content="width=device-width, initial-scale=${viewport}, maximum-scale=5.0, user-scalable=yes" />
  <meta name="format-detection" content="telephone=no" />
  <title>${this.escapeHtml(title)}</title>
  <meta name="title" content="${this.escapeHtml(title)}" />
  <meta name="description" content="${this.escapeHtml(description)}" />
  <meta name="author" content="Warmthly" />
  <meta name="language" content="en" />
  <link rel="canonical" href="${canonical}" />
${robotsMeta}  <meta property="og:type" content="${type}" />
  <meta property="og:url" content="${currentUrl}" />
  <meta property="og:title" content="${this.escapeHtml(title)}" />
  <meta property="og:description" content="${this.escapeHtml(description)}" />
  <meta property="og:image" content="${image}" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:image:alt" content="${this.escapeHtml(title)}" />
  <meta property="og:site_name" content="${siteName}" />
  <meta property="og:locale" content="en_US" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:url" content="${currentUrl}" />
  <meta name="twitter:title" content="${this.escapeHtml(title)}" />
  <meta name="twitter:description" content="${this.escapeHtml(description)}" />
  <meta name="twitter:image" content="${image}" />
  <meta name="twitter:image:alt" content="${this.escapeHtml(title)}" />
  <meta name="apple-mobile-web-app-capable" content="yes" />
  <meta name="apple-mobile-web-app-status-bar-style" content="default" />
  <meta name="apple-mobile-web-app-title" content="${siteName}" />
  <meta name="mobile-web-app-capable" content="yes" />
${preconnectLinks ? `  ${preconnectLinks}\n` : ''}  <link rel="icon" type="image/svg+xml" href="${WARMTHLY_CONFIG.favicon}">
  <link rel="icon" type="image/svg+xml" sizes="any" href="${WARMTHLY_CONFIG.favicon}">
  <link rel="apple-touch-icon" href="${WARMTHLY_CONFIG.favicon}">
  <link rel="manifest" href="/manifest.json">
  <link rel="preload" href="${WARMTHLY_CONFIG.fonts.inter}" as="font" type="font/ttf" crossorigin="anonymous">
  <link rel="preload" href="${WARMTHLY_CONFIG.fonts.cormorant}" as="font" type="font/ttf" crossorigin="anonymous">
${cssPreloadLinks}
${cssLinks}
  <script>
    // Inline early blocker to catch Cloudflare Insights before it loads
    (function(){'use strict';const b=['cloudflareinsights.com','static.cloudflareinsights.com'];function s(u){if(!u)return false;return b.some(d=>u.includes(d));}const of=window.fetch;window.fetch=function(...a){const u=typeof a[0]==='string'?a[0]:a[0].url;if(s(u)){return Promise.reject(new Error('Tracker blocked'));}return of.apply(this,a);};const ox=XMLHttpRequest.prototype.open;XMLHttpRequest.prototype.open=function(m,u,...r){if(s(u)){throw new Error('Tracker blocked');}return ox.apply(this,[m,u,...r]);};const oc=document.createElement;document.createElement=function(t,...r){const e=oc.call(this,t,...r);if(t.toLowerCase()==='script'){const sa=e.setAttribute;e.setAttribute=function(n,v){if(n==='src'&&s(v)){return;}return sa.call(this,n,v);};}return e;};const mo=new MutationObserver(function(m){m.forEach(function(mu){mu.addedNodes.forEach(function(n){if(n.nodeType===1&&n.tagName==='SCRIPT'){const src=n.src||n.getAttribute('src')||'';if(s(src)||(n.innerHTML||'').includes('cloudflareinsights')){n.remove();}}}});});mo.observe(document.documentElement||document.body||document,{childList:true,subtree:true});if(document.querySelector){document.querySelectorAll('script[src*="cloudflareinsights"]').forEach(s=>s.remove());}})();
  </script>
  <script src="/lego/utils/tracker-blocker.js"></script>
  <script type="application/ld+json">
${JSON.stringify(structuredData, null, 2)}
  </script>
`;
    
    while (temp.firstChild) {
      const child = temp.firstChild;
      if (child.tagName === 'TITLE') {
        const existingTitle = document.head.querySelector('title');
        if (existingTitle) {
          existingTitle.textContent = child.textContent;
        } else {
          document.head.appendChild(child);
        }
      } else {
        document.head.appendChild(child);
      }
    }
    
    // Show body with fade-in animation
    const showBody = () => {
      if (document.body && !document.body.classList.contains('css-loaded')) {
        document.body.classList.add('css-loaded');
      }
    };
    
    // Show body immediately - CSS is loading, animation will handle the fade-in
    // Use requestAnimationFrame to ensure DOM is ready
    if (document.body) {
      requestAnimationFrame(() => {
        requestAnimationFrame(showBody);
      });
    } else {
      // If body not ready, wait a bit
      setTimeout(showBody, 10);
    }
    
    // Fallback: always show after 100ms max
    setTimeout(showBody, 100);
    
    // Also wait for CSS to load for better experience (non-blocking)
    this.waitForCSSLoad(appCssFiles, stylesPath).then(() => {
      showBody();
    }).catch(() => {
      // Already shown from fallback above
    });
    
    this.style.display = 'none';
  }
  
  async waitForCSSLoad(cssFiles, stylesPath) {
    // Wait a tiny bit for link elements to be added to DOM
    await new Promise(resolve => setTimeout(resolve, 10));
    
    // Find the CSS link elements we just added
    const requiredFileNames = cssFiles.map(css => css.split('/').pop());
    const links = Array.from(document.querySelectorAll('link[rel="stylesheet"]'))
      .filter(link => {
        const href = link.href || '';
        return requiredFileNames.some(fileName => href.includes(fileName));
      });
    
    if (links.length === 0) {
      // Links not found, show anyway after short delay
      return new Promise(resolve => setTimeout(resolve, 200));
    }
    
    // Check if all are already loaded
    const allLoaded = links.every(link => link.sheet);
    if (allLoaded) {
      return;
    }
    
    // Wait for all CSS files to load
    return new Promise((resolve) => {
      let loadedCount = 0;
      const totalLinks = links.length;
      const maxWait = 2000; // Max 2 seconds wait
      const startTime = Date.now();
      
      const checkComplete = () => {
        if (loadedCount >= totalLinks || (Date.now() - startTime) > maxWait) {
          resolve();
        }
      };
      
      links.forEach(link => {
        if (link.sheet) {
          loadedCount++;
          checkComplete();
        } else {
          // Use both onload and periodic checking for reliability
          const handleLoad = () => {
            loadedCount++;
            checkComplete();
          };
          
          link.addEventListener('load', handleLoad, { once: true });
          link.addEventListener('error', handleLoad, { once: true });
          
          // Also check periodically in case events don't fire
          const checkInterval = setInterval(() => {
            if (link.sheet) {
              clearInterval(checkInterval);
              if (loadedCount < totalLinks) {
                loadedCount++;
                checkComplete();
              }
            } else if ((Date.now() - startTime) > maxWait) {
              clearInterval(checkInterval);
              checkComplete();
            }
          }, 20);
        }
      });
      
      checkComplete();
    });
  }
  
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

customElements.define('warmthly-head', WarmthlyHead);
