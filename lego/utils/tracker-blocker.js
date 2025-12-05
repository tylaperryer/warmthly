/**
 * Tracker Blocker - Blocks all tracking, analytics, and data collection
 * This script makes it structurally impossible to load trackers
 */

(function() {
  'use strict';
  
  // Allowed domains (payment processing, essential services)
  const allowedDomains = [
    'verygoodvault.com',
    'js.verygoodvault.com',
    'yoco.com',
    'js.yoco.com',
    'payments.yoco.com',
    'online.yoco.com'
  ];
  
  // List of known tracking domains to block
  const blockedDomains = [
    'cloudflareinsights.com',
    'static.cloudflareinsights.com',
    'd3na0td23j4fjn.cloudfront.net',
    'google-analytics.com',
    'googletagmanager.com',
    'googleadservices.com',
    'doubleclick.net',
    'facebook.com',
    'facebook.net',
    'fbcdn.net',
    'analytics.facebook.com',
    'pixel.facebook.com',
    'hotjar.com',
    'mixpanel.com',
    'segment.com',
    'amplitude.com',
    'heap.io',
    'fullstory.com',
    'logrocket.com',
    'sentry.io',
    'newrelic.com',
    'datadoghq.com',
    'adroll.com',
    'criteo.com',
    'outbrain.com',
    'taboola.com',
    'quantserve.com',
    'scorecardresearch.com',
    'advertising.com',
    'adtechus.com'
  ];
  
  // Helper function to check if domain should be blocked
  function shouldBlock(url) {
    if (!url) return false;
    
    // Check if it's an allowed domain first
    if (allowedDomains.some(domain => url.includes(domain))) {
      return false;
    }
    
    // Then check if it's a blocked domain
    return blockedDomains.some(domain => url.includes(domain));
  }
  
  // Block fetch requests to tracking domains
  const originalFetch = window.fetch;
  window.fetch = function(...args) {
    const url = typeof args[0] === 'string' ? args[0] : args[0].url;
    if (shouldBlock(url)) {
      console.warn('[Tracker Blocker] Blocked fetch to:', url);
      return Promise.reject(new Error('Tracker blocked'));
    }
    return originalFetch.apply(this, args);
  };
  
  // Block XMLHttpRequest to tracking domains
  const originalOpen = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function(method, url, ...rest) {
    if (shouldBlock(url)) {
      console.warn('[Tracker Blocker] Blocked XHR to:', url);
      throw new Error('Tracker blocked');
    }
    return originalOpen.apply(this, [method, url, ...rest]);
  };
  
  // Block script tags with tracking domains
  const originalCreateElement = document.createElement;
  document.createElement = function(tagName, ...rest) {
    const element = originalCreateElement.call(this, tagName, ...rest);
    
    if (tagName.toLowerCase() === 'script') {
      const originalSetAttribute = element.setAttribute;
      element.setAttribute = function(name, value) {
        if (name === 'src' && shouldBlock(value)) {
          console.warn('[Tracker Blocker] Blocked script src:', value);
          return;
        }
        return originalSetAttribute.call(this, name, value);
      };
      
      // Also block if src is set directly
      Object.defineProperty(element, 'src', {
        set: function(value) {
          if (shouldBlock(value)) {
            console.warn('[Tracker Blocker] Blocked script src:', value);
            return;
          }
          originalSetAttribute.call(this, 'src', value);
        },
        get: function() {
          return this.getAttribute('src');
        }
      });
    }
    
    // Block img tags with tracking pixels
    if (tagName.toLowerCase() === 'img') {
      const originalSetAttribute = element.setAttribute;
      element.setAttribute = function(name, value) {
        if (name === 'src' && shouldBlock(value)) {
          console.warn('[Tracker Blocker] Blocked tracking pixel:', value);
          return;
        }
        return originalSetAttribute.call(this, name, value);
      };
    }
    
    return element;
  };
  
  // Block iframe with tracking domains
  const observer = new MutationObserver(function(mutations) {
    mutations.forEach(function(mutation) {
      mutation.addedNodes.forEach(function(node) {
        if (node.nodeType === 1) { // Element node
          // Check iframe src
          if (node.tagName === 'IFRAME' && node.src) {
            if (shouldBlock(node.src)) {
              console.warn('[Tracker Blocker] Blocked iframe:', node.src);
              node.remove();
            }
          }
          
          // Check script tags
          if (node.tagName === 'SCRIPT' && node.src) {
            if (shouldBlock(node.src)) {
              console.warn('[Tracker Blocker] Blocked script:', node.src);
              node.remove();
            }
          }
          
          // Check img tags (tracking pixels)
          if (node.tagName === 'IMG' && node.src) {
            if (shouldBlock(node.src)) {
              console.warn('[Tracker Blocker] Blocked tracking pixel:', node.src);
              node.remove();
            }
          }
        }
      });
    });
  });
  
  observer.observe(document, {
    childList: true,
    subtree: true
  });
  
  // Block localStorage/sessionStorage access for known tracking keys
  const trackingKeys = ['_ga', '_gid', '_gat', '_fbp', '_fbc', 'amplitude_', 'mixpanel_', 'segment_'];
  const originalSetItem = Storage.prototype.setItem;
  Storage.prototype.setItem = function(key, value) {
    if (trackingKeys.some(trackingKey => key.includes(trackingKey))) {
      console.warn('[Tracker Blocker] Blocked storage setItem:', key);
      return;
    }
    return originalSetItem.call(this, key, value);
  };
  
  // Block cookies for tracking domains (but allow payment cookies)
  const originalCookieDescriptor = Object.getOwnPropertyDescriptor(Document.prototype, 'cookie') ||
                                   Object.getOwnPropertyDescriptor(HTMLDocument.prototype, 'cookie');
  
  if (originalCookieDescriptor && originalCookieDescriptor.set) {
    Object.defineProperty(document, 'cookie', {
      get: originalCookieDescriptor.get,
      set: function(value) {
        // Allow cookies from payment domains
        const currentDomain = window.location.hostname;
        const isPaymentDomain = allowedDomains.some(domain => currentDomain.includes(domain.split('.')[0]));
        
        if (!isPaymentDomain && value) {
          // Check if cookie is from blocked domain
          if (blockedDomains.some(domain => value.includes(domain))) {
            console.warn('[Tracker Blocker] Blocked cookie:', value);
            return;
          }
          // Also check if cookie name matches tracking patterns
          const cookieName = value.split('=')[0].trim();
          if (trackingKeys.some(trackingKey => cookieName.includes(trackingKey))) {
            console.warn('[Tracker Blocker] Blocked tracking cookie:', cookieName);
            return;
          }
        }
        return originalCookieDescriptor.set.call(this, value);
      },
      configurable: true
    });
  }
  
  // Block navigator.sendBeacon for tracking
  if (navigator.sendBeacon) {
    const originalSendBeacon = navigator.sendBeacon;
    navigator.sendBeacon = function(url, data) {
      if (shouldBlock(url)) {
        console.warn('[Tracker Blocker] Blocked sendBeacon to:', url);
        return false;
      }
      return originalSendBeacon.call(this, url, data);
    };
  }
  
  // Block Cloudflare Insights immediately on page load (runs before DOM is ready)
  (function blockCloudflareInsightsEarly() {
    // Remove any existing Cloudflare Insights scripts
    if (document.querySelector) {
      document.querySelectorAll('script[src*="cloudflareinsights"], script[src*="static.cloudflareinsights"]').forEach(script => {
        script.remove();
        console.warn('[Tracker Blocker] Removed Cloudflare Insights script');
      });
    }
    
    // Block any Cloudflare Insights scripts that try to load
    if (document.addEventListener) {
      document.addEventListener('DOMContentLoaded', function() {
        document.querySelectorAll('script[src*="cloudflareinsights"], script[src*="static.cloudflareinsights"]').forEach(script => {
          script.remove();
          console.warn('[Tracker Blocker] Removed Cloudflare Insights script on DOMContentLoaded');
        });
      });
    }
  })();
  
  // Enhanced observer to catch Cloudflare Insights specifically
  const cloudflareObserver = new MutationObserver(function(mutations) {
    mutations.forEach(function(mutation) {
      mutation.addedNodes.forEach(function(node) {
        if (node.nodeType === 1) {
          // Check for Cloudflare Insights in any form
          if (node.tagName === 'SCRIPT') {
            const src = node.src || node.getAttribute('src') || '';
            const innerHTML = node.innerHTML || '';
            if (src.includes('cloudflareinsights') || innerHTML.includes('cloudflareinsights') || 
                src.includes('static.cloudflareinsights') || innerHTML.includes('static.cloudflareinsights')) {
              console.warn('[Tracker Blocker] Blocked Cloudflare Insights:', src || 'inline script');
              node.remove();
            }
          }
          // Also check iframe
          if (node.tagName === 'IFRAME') {
            const src = node.src || node.getAttribute('src') || '';
            if (src.includes('cloudflareinsights') || src.includes('static.cloudflareinsights')) {
              console.warn('[Tracker Blocker] Blocked Cloudflare Insights iframe:', src);
              node.remove();
            }
          }
        }
      });
    });
  });
  
  cloudflareObserver.observe(document.documentElement || document.body || document, {
    childList: true,
    subtree: true
  });
  
  console.log('[Tracker Blocker] Active - All tracking blocked');
})();

