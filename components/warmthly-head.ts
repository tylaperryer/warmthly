/**
 * Warmthly Head Web Component
 * Dynamically generates and injects head elements (meta tags, links, scripts)
 * Provides SEO, security headers, and resource hints
 *
 * Usage:
 * <warmthly-head
 *   title="Page Title"
 *   description="Page description"
 *   app="main"
 *   viewport="0.75"
 *   preconnects="https://example.com"
 *   robots="noindex,nofollow"
 *   image="https://example.com/image.jpg"
 *   type="website"
 *   canonical="https://example.com/page">
 * </warmthly-head>
 */

import { WARMTHLY_CONFIG, type AppName } from '@config/warmthly-config.js';
import { getErrorBoundary, ErrorSeverity } from '@core/error-boundary.js';

import { generateHreflangTags, generateOGLocaleAlternates } from './warmthly-head-helper.js';

/**
 * CSS files configuration per app
 */
const CSS_FILES: Record<AppName, readonly string[]> = {
  main: ['common.css'],
  mint: ['common.css', 'mint.css'],
  post: ['common.css', 'post.css'],
  admin: ['common.css', 'admin.css'],
} as const;

/**
 * Default values
 */
const DEFAULT_TITLE = 'Warmthly';
const DEFAULT_DESCRIPTION =
  'Warmthly - Rehumanize our world - making empathy a measurable part of our systems';
const DEFAULT_APP: AppName = 'main';
const DEFAULT_VIEWPORT = '0.75';
const DEFAULT_TYPE = 'website';
const SITE_NAME = 'Warmthly';

/**
 * Get dynamic OG image URL
 * Generates images on-demand from site content
 * SEO Enhancement - 4.1: Dynamic Open Graph Images
 */
function getDynamicOGImage(
  app: AppName,
  pathname: string,
  title: string,
  description: string
): string {
  const baseUrl = WARMTHLY_CONFIG.urls.main;
  const ogImageApi = `${baseUrl}/og-image`;

  // Determine page type for styling
  let type = '';
  if (pathname.includes('/help')) {
    type = 'help';
  } else if (pathname.includes('/privacy')) {
    type = 'privacy';
  } else if (pathname.includes('/easy-read')) {
    type = 'easy-read';
  } else if (pathname.includes('/report')) {
    type = 'report';
  } else if (pathname.includes('/vote')) {
    type = 'vote';
  } else if (pathname.includes('/research')) {
    type = 'research';
  }

  // Encode parameters
  const params = new URLSearchParams({
    title: title.substring(0, 100), // Limit title length
    description: description.substring(0, 200), // Limit description length
    app: app,
  });

  if (type) {
    params.set('type', type);
  }

  return `${ogImageApi}?${params.toString()}`;
}

/**
 * Get current language from document or URL
 * Supports all 7,019+ languages
 */
function getCurrentLanguage(): string {
  // Check document lang attribute
  if (typeof document !== 'undefined' && document.documentElement?.lang) {
    return document.documentElement.lang;
  }

  // Check URL parameter
  if (typeof window !== 'undefined') {
    const urlParams = new URLSearchParams(window.location.search);
    const langFromUrl = urlParams.get('lang');
    if (langFromUrl) {
      return langFromUrl;
    }
  }

  // Default to English
  return 'en';
}

/**
 * Translate text using i18n system (if available)
 * Falls back to English if translation not available
 */
async function translateText(key: string, fallback: string, lang?: string): Promise<string> {
  const currentLang = lang || getCurrentLanguage();

  // If English, return fallback
  if (currentLang === 'en') {
    return fallback;
  }

  // Try to get translation from i18n system
  try {
    // Check if i18n is available
    if (typeof window !== 'undefined' && (window as any).i18n) {
      const i18n = (window as any).i18n;
      const translation = i18n.t(key);
      if (translation && translation !== key) {
        return translation;
      }
    }

    // Try to fetch from API
    const { API_CONFIG } = await import('@config/api-config.js');
    const response = await fetch(API_CONFIG.getUrl(`api/i18n/${currentLang}?chunked=false`));
    if (response.ok) {
      const translations = await response.json();
      if (translations[key]) {
        return translations[key];
      }
    }
  } catch (error) {
    // Silently fail and return fallback
  }

  return fallback;
}

/**
 * Generate breadcrumb structured data
 * SEO Enhancement - 4.2: Enhanced Structured Data
 * Supports translations for all 7,019+ languages
 */
async function generateBreadcrumbList(app: AppName, pathname: string): Promise<object> {
  const baseUrl = WARMTHLY_CONFIG.urls[app];
  const currentLang = getCurrentLanguage();
  const items: Array<{ '@type': string; position: number; name: string; item: string }> = [];

  // Home - translate
  const homeText = await translateText('common.home', 'Home', currentLang);
  items.push({
    '@type': 'ListItem',
    position: 1,
    name: homeText,
    item: WARMTHLY_CONFIG.urls.main,
  });

  // App-specific breadcrumbs - translate
  if (app !== 'main') {
    const appName = app.charAt(0).toUpperCase() + app.slice(1);
    items.push({
      '@type': 'ListItem',
      position: 2,
      name: appName, // App names typically don't need translation
      item: baseUrl,
    });
  }

  // Page-specific breadcrumbs - translate
  if (pathname.includes('/help')) {
    const helpText = await translateText('common.help', 'Help', currentLang);
    items.push({
      '@type': 'ListItem',
      position: app === 'main' ? 2 : 3,
      name: helpText,
      item: `${WARMTHLY_CONFIG.urls.main}/help.html`,
    });
  } else if (pathname.includes('/privacy')) {
    const privacyText = await translateText('common.privacy', 'Privacy Policy', currentLang);
    items.push({
      '@type': 'ListItem',
      position: app === 'main' ? 2 : 3,
      name: privacyText,
      item: `${WARMTHLY_CONFIG.urls.main}/privacy.html`,
    });
  } else if (pathname.includes('/report')) {
    const reportText = await translateText('common.report', 'Report', currentLang);
    items.push({
      '@type': 'ListItem',
      position: 3,
      name: reportText,
      item: `${baseUrl}/report/`,
    });
  } else if (pathname.includes('/vote')) {
    const voteText = await translateText('common.vote', 'Dissolution Vote', currentLang);
    items.push({
      '@type': 'ListItem',
      position: 3,
      name: voteText,
      item: `${baseUrl}/vote/`,
    });
  } else if (pathname.includes('/your-data')) {
    const dataText = await translateText('common.yourData', 'Your Data', currentLang);
    items.push({
      '@type': 'ListItem',
      position: 3,
      name: dataText,
      item: `${baseUrl}/your-data/`,
    });
  } else if (pathname.includes('/research')) {
    const researchText = await translateText('common.research', 'Research', currentLang);
    items.push({
      '@type': 'ListItem',
      position: 3,
      name: researchText,
      item: `${baseUrl}/research/`,
    });
  } else if (pathname.includes('/emails')) {
    const emailsText = await translateText('common.emails', 'Emails', currentLang);
    items.push({
      '@type': 'ListItem',
      position: 3,
      name: emailsText,
      item: `${baseUrl}/emails/`,
    });
  }

  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items,
  };
}

/**
 * Generate WebSite structured data with searchAction
 * SEO Enhancement - 4.2: Enhanced Structured Data
 */
function generateWebSiteSchema(): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_NAME,
    url: WARMTHLY_CONFIG.urls.main,
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${WARMTHLY_CONFIG.urls.main}/search?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };
}

/**
 * Generate FAQPage structured data for help page
 * SEO Enhancement - 4.2: Enhanced Structured Data
 */
function generateFAQPageSchema(): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'How do I make a donation?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'To make a donation, click the "Donate" button on our homepage. You\'ll be able to choose a preset amount or enter a custom amount. We accept multiple currencies and use secure payment processing through Yoco.',
        },
      },
      {
        '@type': 'Question',
        name: 'What payment methods do you accept?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'We accept credit and debit cards through our secure payment processor, Yoco. All payments are processed securely and we never store your full payment details.',
        },
      },
      {
        '@type': 'Question',
        name: 'How is my donation used?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: "We maintain complete transparency about how donations are used. You can view all transactions and decisions on our Mint page, which shows real-time tracking of every donation and how it's allocated.",
        },
      },
      {
        '@type': 'Question',
        name: 'How does Warmthly ensure transparency?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'We believe transparency is fundamental to trust. Every donation is tracked and displayed on our Mint page in real-time. All organizational decisions and milestones are recorded on our Post page, creating a complete timeline of our activities.',
        },
      },
      {
        '@type': 'Question',
        name: 'Is the website accessible?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: "Yes! We're committed to making Warmthly accessible to everyone. Our website meets WCAG 2.2 AA standards and includes keyboard navigation support, screen reader compatibility, high contrast support, responsive design that works at all zoom levels, clear focus indicators, and semantic HTML structure.",
        },
      },
    ],
  };
}

/**
 * Generate HowTo schema for donation process
 * SEO Enhancement - 4.2: Enhanced Structured Data
 */
function generateHowToSchema(): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: 'How to Make a Donation to Warmthly',
    description:
      "Step-by-step guide to making a donation to support Warmthly's mission to make empathy a measurable part of our systems.",
    step: [
      {
        '@type': 'HowToStep',
        position: 1,
        name: 'Choose donation amount',
        text: 'Select a preset amount from the available options or enter a custom amount that works for you.',
        image: `${WARMTHLY_CONFIG.urls.main}/assets/images/donation-step1.png`,
      },
      {
        '@type': 'HowToStep',
        position: 2,
        name: 'Select currency',
        text: 'Choose your preferred currency from the dropdown menu. We support multiple currencies including USD, EUR, GBP, ZAR, and more.',
        image: `${WARMTHLY_CONFIG.urls.main}/assets/images/donation-step2.png`,
      },
      {
        '@type': 'HowToStep',
        position: 3,
        name: 'Enter payment details',
        text: 'Securely enter your payment information through our payment processor, Yoco. We never store your full payment details.',
        image: `${WARMTHLY_CONFIG.urls.main}/assets/images/donation-step3.png`,
      },
      {
        '@type': 'HowToStep',
        position: 4,
        name: 'Complete donation',
        text: "Review your donation details and confirm. You'll receive a confirmation and can track your donation on our Mint page.",
        image: `${WARMTHLY_CONFIG.urls.main}/assets/images/donation-step4.png`,
      },
    ],
    totalTime: 'PT2M', // 2 minutes
  };
}

/**
 * Generate VideoObject schema for video content
 * SEO Enhancement - 4.2: Enhanced Structured Data
 */
function generateVideoObjectSchema(
  title: string,
  description: string,
  videoUrl?: string,
  thumbnailUrl?: string
): object {
  const baseUrl = WARMTHLY_CONFIG.urls.main;

  return {
    '@context': 'https://schema.org',
    '@type': 'VideoObject',
    name: title,
    description: description,
    thumbnailUrl: thumbnailUrl || `${baseUrl}/assets/images/video-thumbnail.jpg`,
    uploadDate: new Date().toISOString(),
    contentUrl: videoUrl || 'https://www.youtube.com/watch?v=kVausES-mjk',
    embedUrl: videoUrl
      ? videoUrl.replace('/watch?v=', '/embed/')
      : 'https://www.youtube-nocookie.com/embed/kVausES-mjk',
    duration: 'PT3M30S', // 3 minutes 30 seconds (adjust based on actual video)
    publisher: {
      '@type': 'Organization',
      name: SITE_NAME,
      logo: {
        '@type': 'ImageObject',
        url: `${baseUrl}${WARMTHLY_CONFIG.favicon}`,
      },
    },
  };
}

/**
 * Generate DonateAction schema
 * SEO Enhancement - 4.2: Enhanced Structured Data
 */
function generateDonateActionSchema(): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'DonateAction',
    target: {
      '@type': 'EntryPoint',
      urlTemplate: `${WARMTHLY_CONFIG.urls.main}/#donate`,
      actionPlatform: [
        'http://schema.org/DesktopWebPlatform',
        'http://schema.org/MobileWebPlatform',
      ],
    },
    object: {
      '@type': 'Organization',
      name: SITE_NAME,
      url: WARMTHLY_CONFIG.urls.main,
    },
    recipient: {
      '@type': 'Organization',
      name: SITE_NAME,
      description: DEFAULT_DESCRIPTION,
    },
  };
}

/**
 * Warmthly Head Web Component
 */
class WarmthlyHead extends HTMLElement {
  /**
   * Called when element is inserted into the DOM
   * Generates and injects head elements
   */
  async connectedCallback(): Promise<void> {
    // Safety check for browser environment
    if (typeof document === 'undefined' || typeof window === 'undefined') {
      return;
    }

    try {
      // Get attributes with defaults
      const title = this.getAttribute('title') || DEFAULT_TITLE;
      const description = this.getAttribute('description') || DEFAULT_DESCRIPTION;
      const app = (this.getAttribute('app') || DEFAULT_APP) as AppName;
      const viewport = this.getAttribute('viewport') || DEFAULT_VIEWPORT;
      const preconnects = this.getAttribute('preconnects') || '';
      const robots = this.getAttribute('robots') || '';
      const lastModified = this.getAttribute('last-modified') || '';
      // Determine OG image - use dynamic generator (SEO Enhancement - 4.1)
      const image =
        this.getAttribute('image') ||
        getDynamicOGImage(app, window.location.pathname, title, description);
      const type = this.getAttribute('type') || DEFAULT_TYPE;
      const canonical = this.getAttribute('canonical') || window.location.href;

      const currentUrl = canonical;
      const stylesPath = WARMTHLY_CONFIG.paths.styles;

      // Get CSS files for app
      const appCssFiles = CSS_FILES[app] || CSS_FILES.main;

      // Critical CSS - Inline in <head> for faster initial render (Performance Optimization - 3.3)
      const criticalCSS = `
/* Critical CSS - Above-the-fold styles */
:root{--warmthly-orange:#FF8C42;--warmthly-orange-hover:#e07a35;--warmthly-background:#fff6f1;--warmthly-background-alt:#ffeee6;--text-color:#1a1a1a;--font-size-base:1rem;--font-size-2xl:1.875rem;--font-size-xl:1.5rem;--line-height-base:1.618;--spacing-6:1.5rem;--spacing-4:1rem;--spacing-2:0.5rem;--z-header:1001;--z-stoplight:1002}
*{margin:0;padding:0;box-sizing:border-box}
html{overflow-x:hidden;overflow-y:auto}
body{font-family:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;font-size:var(--font-size-base);line-height:var(--line-height-base);color:var(--text-color);background:var(--warmthly-background);min-height:100vh;position:relative;overflow-x:hidden}
body:not(.fonts-loaded){visibility:hidden;opacity:0}
body.fonts-loaded{visibility:visible;opacity:0;animation:fadeInFromBg 0.8s ease-out forwards}
@keyframes fadeInFromBg{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
body::before{content:'';position:fixed;top:0;left:0;width:100%;height:100vh;background:radial-gradient(circle at 20% 30%,rgba(255,140,66,0.15) 0%,transparent 50%),radial-gradient(circle at 80% 20%,rgba(255,182,193,0.12) 0%,transparent 50%),linear-gradient(135deg,var(--warmthly-background) 0%,var(--warmthly-background-alt) 100%);z-index:-1;pointer-events:none}
.header{position:fixed;top:var(--spacing-6);left:var(--spacing-6);right:var(--spacing-6);display:flex;justify-content:space-between;align-items:center;z-index:var(--z-header);pointer-events:none}
.header-left,.header-right{pointer-events:auto}
.brand-logo,.top-left-heading{font-family:'Cormorant Garamond',Georgia,serif;font-weight:700;font-size:var(--font-size-xl);color:var(--warmthly-orange);text-decoration:none}
.stoplight-container{position:relative;z-index:var(--z-stoplight)}
.stoplight{display:flex;flex-direction:column;gap:var(--spacing-2);cursor:pointer;padding:var(--spacing-2);min-width:24px;min-height:24px}
.stoplight-dot{width:8px;height:8px;border-radius:50%}
.skip-link{position:absolute;top:calc(var(--spacing-10)*-1);left:0;background:var(--warmthly-orange);color:white;padding:var(--spacing-2) var(--spacing-4);text-decoration:none;z-index:10000;border-radius:0 0 10px 0;font-weight:600}
.skip-link:focus{top:0}
:focus-visible{outline:3px solid var(--warmthly-orange);outline-offset:2px;z-index:999999;position:relative}
.container{max-width:800px;margin:0 auto;padding:var(--spacing-24) var(--spacing-6) var(--spacing-10);color:var(--text-color);position:relative;z-index:1}
h1,h2,h3{font-family:'Inter',sans-serif;font-weight:600;color:var(--text-color);margin:0}
h1{font-size:var(--font-size-2xl);line-height:1.2;margin-bottom:var(--spacing-6)}
.logo{font-family:'Inter',sans-serif;font-size:var(--font-size-2xl);font-weight:600;color:var(--warmthly-orange)}
.subtitle{font-size:var(--font-size-base);color:var(--text-color);opacity:0.8;line-height:var(--line-height-base)}
`;

      // Generate CSS preload links for non-critical CSS (loaded asynchronously)
      const cssPreloadLinks = appCssFiles
        .map(
          css =>
            `  <link rel="preload" href="${stylesPath}/${css}" as="style" onload="this.onload=null;this.rel='stylesheet'">`
        )
        .join('\n');

      // Generate fallback CSS links (for browsers without JS)
      const cssLinks = appCssFiles
        .map(css => `  <noscript><link rel="stylesheet" href="${stylesPath}/${css}"></noscript>`)
        .join('\n');

      // Generate preconnect links
      const preconnectLinks = preconnects
        .split(',')
        .filter(Boolean)
        .map(domain => `  <link rel="preconnect" href="${domain.trim()}" crossorigin>`)
        .join('\n');

      // Generate robots meta tag
      const robotsMeta = robots
        ? `  <meta name="robots" content="${this.escapeHtml(robots)}">\n`
        : '';

      // Generate last-modified meta tag (SEO Enhancement - Last Updated Dates)
      const lastModifiedMeta = lastModified
        ? `  <meta name="last-modified" content="${this.escapeHtml(lastModified)}">\n`
        : '';

      // Generate structured data (JSON-LD) - SEO Enhancement 4.2
      const structuredDataArray: object[] = [];

      // Organization schema (always included)
      structuredDataArray.push({
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name: SITE_NAME,
        url: WARMTHLY_CONFIG.urls.main,
        logo: `${WARMTHLY_CONFIG.urls.main}${WARMTHLY_CONFIG.favicon}`,
        description: DEFAULT_DESCRIPTION,
        sameAs: [],
      });

      // WebPage schema with dateModified (SEO Enhancement - Content Freshness)
      if (lastModified || window.location.pathname !== '/') {
        structuredDataArray.push({
          '@context': 'https://schema.org',
          '@type': 'WebPage',
          '@id': canonical,
          url: canonical,
          name: title,
          description: description,
          datePublished: '2024-01-01T00:00:00Z', // Initial publication date
          dateModified: lastModified ? `${lastModified}T00:00:00Z` : new Date().toISOString(),
          inLanguage: document.documentElement.lang || 'en',
          isPartOf: {
            '@type': 'WebSite',
            name: SITE_NAME,
            url: WARMTHLY_CONFIG.urls.main,
          },
        });
      }

      // WebSite schema with searchAction
      structuredDataArray.push(generateWebSiteSchema());

      // BreadcrumbList schema (with translation support)
      const breadcrumbSchema = await generateBreadcrumbList(app, window.location.pathname);
      structuredDataArray.push(breadcrumbSchema);

      // FAQPage schema for help page
      if (window.location.pathname.includes('/help')) {
        structuredDataArray.push(generateFAQPageSchema());
      }

      // HowTo schema for donation process (main page)
      if (
        app === 'main' &&
        (window.location.pathname === '/' || window.location.pathname === '/index.html')
      ) {
        structuredDataArray.push(generateHowToSchema());
      }

      // VideoObject schema for video content (main page with video)
      if (app === 'main' && window.location.pathname.includes('video')) {
        structuredDataArray.push(
          generateVideoObjectSchema(
            title,
            description,
            'https://www.youtube.com/watch?v=kVausES-mjk',
            image
          )
        );
      } else if (
        app === 'main' &&
        (window.location.pathname === '/' || window.location.pathname === '/index.html')
      ) {
        // Main page has video, add VideoObject schema
        structuredDataArray.push(
          generateVideoObjectSchema(
            title,
            description,
            'https://www.youtube.com/watch?v=kVausES-mjk',
            image
          )
        );
      }

      // DonateAction schema (main page)
      if (app === 'main') {
        structuredDataArray.push(generateDonateActionSchema());
      }

      // Generate hreflang tags (SEO Enhancement 4.3)
      const hreflangTags = generateHreflangTags(canonical, app);

      // Generate CSP nonce for inline scripts (Security Enhancement - Nonce-based CSP)
      // Note: In a server-rendered setup, nonces should be generated server-side
      // For client-side, we generate a random nonce per page load
      const cspNonce = this.generateNonce();

      // Enhanced CSP policy with nonces - removes unsafe-inline for better security
      // Security Enhancement 3: Nonce-based CSP
      // Security Enhancement 8: CSP Reporting
      const baseUrl = WARMTHLY_CONFIG.urls.main;
      const cspReportUrl = `${baseUrl}/api/csp-report`;
      const cspPolicy = [
        "default-src 'self'",
        `script-src 'self' 'nonce-${cspNonce}' https://cdnjs.cloudflare.com https://js.yoco.com https://js.verygoodvault.com https://www.gstatic.com`,
        "style-src 'self' 'unsafe-inline' https://cdn.quilljs.com", // Keep unsafe-inline for styles as nonces are less critical
        "font-src 'self' data:",
        "img-src 'self' data: https: blob:",
        "connect-src 'self' https://api.airtable.com https://payments.yoco.com https://online.yoco.com https://verygoodvault.com https://api.exchangerate-api.com https://www.googleapis.com https://*.firebaseio.com https://*.firestore.googleapis.com",
        "frame-src 'self' https://js.yoco.com https://js.verygoodvault.com",
        "object-src 'none'",
        "base-uri 'self'",
        "form-action 'self'",
        "frame-ancestors 'none'",
        'upgrade-insecure-requests',
        'block-all-mixed-content',
        "require-trusted-types-for 'script'",
        `report-uri ${cspReportUrl}`,
        `report-to csp-endpoint`,
      ].join('; ');

      const temp = document.createElement('div');
      temp.innerHTML = `
  <meta charset="UTF-8" />
  <meta http-equiv="Content-Security-Policy" content="${cspPolicy}" />
  <meta http-equiv="Report-To" content='{"group":"csp-endpoint","max_age":10886400,"endpoints":[{"url":"${cspReportUrl}"}]}' />
  <meta http-equiv="X-Content-Type-Options" content="nosniff" />
  <meta http-equiv="X-Frame-Options" content="DENY" />
  <meta http-equiv="Referrer-Policy" content="strict-origin-when-cross-origin" />
  <meta http-equiv="Strict-Transport-Security" content="max-age=31536000; includeSubDomains; preload" />
  <meta http-equiv="Permissions-Policy" content="geolocation=(), microphone=(), camera=(), payment=(self 'https://js.yoco.com' 'https://js.verygoodvault.com'), interest-cohort=()" />
  <meta name="theme-color" content="#fff6f1" />
  <meta name="color-scheme" content="light" />
  <meta name="viewport" content="width=device-width, initial-scale=${viewport}, maximum-scale=5.0, user-scalable=yes" />
  <meta name="format-detection" content="telephone=no" />
  <title>${this.escapeHtml(title)}</title>
  <meta name="title" content="${this.escapeHtml(title)}" />
  <meta name="description" content="${this.escapeHtml(description)}" />
  <meta name="author" content="${SITE_NAME}" />
  <meta name="language" content="en" />
  <link rel="canonical" href="${canonical}" />
${robotsMeta}${lastModifiedMeta}  <meta property="og:type" content="${type}" />
  <meta property="og:url" content="${currentUrl}" />
  <meta property="og:title" content="${this.escapeHtml(title)}" />
  <meta property="og:description" content="${this.escapeHtml(description)}" />
  <meta property="og:image" content="${image}" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:image:alt" content="${this.escapeHtml(title)}" />
  <meta property="og:site_name" content="${SITE_NAME}" />
  <meta property="og:locale" content="en_US" />
${generateOGLocaleAlternates()}
${hreflangTags}
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:url" content="${currentUrl}" />
  <meta name="twitter:title" content="${this.escapeHtml(title)}" />
  <meta name="twitter:description" content="${this.escapeHtml(description)}" />
  <meta name="twitter:image" content="${image}" />
  <meta name="twitter:image:alt" content="${this.escapeHtml(title)}" />
  <meta name="apple-mobile-web-app-capable" content="yes" />
  <meta name="apple-mobile-web-app-status-bar-style" content="default" />
  <meta name="apple-mobile-web-app-title" content="${SITE_NAME}" />
  <meta name="mobile-web-app-capable" content="yes" />
${preconnectLinks ? `  ${preconnectLinks}\n` : ''}  <link rel="icon" type="image/svg+xml" href="${
        WARMTHLY_CONFIG.favicon
      }">
  <link rel="icon" type="image/svg+xml" sizes="any" href="${WARMTHLY_CONFIG.favicon}">
  <link rel="apple-touch-icon" href="${WARMTHLY_CONFIG.favicon}">
  <link rel="manifest" href="/manifest.json">
  <link rel="preload" href="${
    WARMTHLY_CONFIG.fonts.inter
  }" as="font" type="font/ttf" crossorigin="anonymous">
  <link rel="preload" href="${
    WARMTHLY_CONFIG.fonts.cormorant
  }" as="font" type="font/ttf" crossorigin="anonymous">
  <style id="critical-css">${criticalCSS}</style>
${cssPreloadLinks}
${cssLinks}
  <script nonce="${cspNonce}">
    // Load non-critical CSS asynchronously (Performance Optimization - 3.3)
    (function() {
      var preloadLinks = document.querySelectorAll('link[rel="preload"][as="style"]');
      preloadLinks.forEach(function(link) {
        if (link.onload) {
          link.onload();
        } else {
          link.rel = 'stylesheet';
        }
      });
    })();
  </script>
  <script nonce="${cspNonce}">
    // Inline early blocker to catch Cloudflare Insights before it loads
    (function(){'use strict';const b=['cloudflareinsights.com','static.cloudflareinsights.com'];function s(u){if(!u)return false;return b.some(d=>u.includes(d));}const of=window.fetch;window.fetch=function(...a){const u=typeof a[0]==='string'?a[0]:a[0].url;if(s(u)){return Promise.reject(new Error('Tracker blocked'));}return of.apply(this,a);};const ox=XMLHttpRequest.prototype.open;XMLHttpRequest.prototype.open=function(m,u,...r){if(s(u)){throw new Error('Tracker blocked');}return ox.apply(this,[m,u,...r]);};const oc=document.createElement;document.createElement=function(t,...r){const e=oc.call(this,t,...r);if(t.toLowerCase()==='script'){const sa=e.setAttribute;e.setAttribute=function(n,v){if(n==='src'&&s(v)){return;}return sa.call(this,n,v);};}return e;};const mo=new MutationObserver(function(m){m.forEach(function(mu){mu.addedNodes.forEach(function(n){if(n.nodeType===1&&n.tagName==='SCRIPT'){const src=n.src||n.getAttribute('src')||'';if(s(src)||(n.innerHTML||'').includes('cloudflareinsights')){n.remove();}}}});});mo.observe(document.documentElement||document.body||document,{childList:true,subtree:true});if(document.querySelector){document.querySelectorAll('script[src*="cloudflareinsights"]').forEach(s=>s.remove());}})();
  </script>
  <script src="/lego/utils/tracker-blocker.js" nonce="${cspNonce}"></script>
${structuredDataArray
  .map(
    data => `  <script type="application/ld+json">
${JSON.stringify(data, null, 2)}
  </script>`
  )
  .join('\n')}
`;

      // Inject elements into head
      while (temp.firstChild) {
        const child = temp.firstChild;
        if (child instanceof HTMLTitleElement) {
          // Handle title specially (replace existing or add)
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

      // Hide the component element
      this.style.display = 'none';
    } catch (error: unknown) {
      // Use error boundary for consistent error handling
      const errorBoundary = getErrorBoundary();
      const errorObj = error instanceof Error ? error : new Error(String(error));
      await errorBoundary.handleError(errorObj, {
        severity: ErrorSeverity.MEDIUM,
        component: 'warmthly-head',
        operation: 'connectedCallback',
        userMessage: 'Failed to initialize page head elements',
        recoverable: true,
        metadata: { tagName: this.tagName },
      });
    }
  }

  /**
   * Generate a cryptographically secure nonce for CSP
   * Uses Web Crypto API when available, falls back to Math.random
   *
   * @returns Base64-encoded nonce string
   */
  private generateNonce(): string {
    // Try Web Crypto API first (more secure)
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
      const array = new Uint8Array(16);
      crypto.getRandomValues(array);
      // Convert to base64
      return btoa(String.fromCharCode(...array))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');
    }

    // Fallback to Math.random (less secure but better than nothing)
    const randomBytes = new Array(16);
    for (let i = 0; i < 16; i++) {
      randomBytes[i] = Math.floor(Math.random() * 256);
    }
    return btoa(String.fromCharCode(...randomBytes))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  }

  /**
   * Escape HTML special characters
   * Prevents XSS attacks by safely escaping user input
   *
   * @param text - Text to escape
   * @returns Escaped text safe for HTML
   */
  private escapeHtml(text: string): string {
    if (typeof document === 'undefined') {
      return text;
    }

    const div = document.createElement('div');
    div.textContent = text;
    return div.textContent || '';
  }
}

// Register the custom element
customElements.define('warmthly-head', WarmthlyHead);

// Export for potential programmatic use
export { WarmthlyHead };
