/**
 * Abbreviation Dictionary and Markup Utility
 * Provides abbreviation expansion and automatic markup
 *
 * WCAG 2.1 AAA Success Criterion 3.1.4 - Abbreviations
 */

export interface Abbreviation {
  abbr: string;
  expansion: string;
  description?: string;
}

/**
 * Comprehensive abbreviation dictionary
 * Maps abbreviations to their full expansions
 */
export const ABBREVIATION_DICTIONARY: Record<string, Abbreviation> = {
  // Web Technologies
  API: {
    abbr: 'API',
    expansion: 'Application Programming Interface',
    description: 'A set of protocols and tools for building software applications',
  },
  HTML: {
    abbr: 'HTML',
    expansion: 'HyperText Markup Language',
    description: 'The standard markup language for web pages',
  },
  CSS: {
    abbr: 'CSS',
    expansion: 'Cascading Style Sheets',
    description: 'A stylesheet language used to describe the presentation of HTML documents',
  },
  JS: {
    abbr: 'JS',
    expansion: 'JavaScript',
    description: 'A programming language for web development',
  },
  JSON: {
    abbr: 'JSON',
    expansion: 'JavaScript Object Notation',
    description: 'A lightweight data interchange format',
  },
  URL: {
    abbr: 'URL',
    expansion: 'Uniform Resource Locator',
    description: 'The address of a web page or resource on the internet',
  },
  HTTP: {
    abbr: 'HTTP',
    expansion: 'HyperText Transfer Protocol',
    description: 'The protocol used for transferring web pages',
  },
  HTTPS: {
    abbr: 'HTTPS',
    expansion: 'HyperText Transfer Protocol Secure',
    description: 'A secure version of HTTP that encrypts data',
  },
  RTL: {
    abbr: 'RTL',
    expansion: 'Right-To-Left',
    description: 'Text direction for languages like Arabic and Hebrew',
  },
  i18n: {
    abbr: 'i18n',
    expansion: 'Internationalization',
    description: 'The process of designing software to support multiple languages',
  },
  PWA: {
    abbr: 'PWA',
    expansion: 'Progressive Web App',
    description: 'A web application that works like a native app',
  },
  SEO: {
    abbr: 'SEO',
    expansion: 'Search Engine Optimization',
    description: 'The practice of improving website visibility in search engines',
  },
  UI: {
    abbr: 'UI',
    expansion: 'User Interface',
    description: 'The visual elements users interact with',
  },
  UX: {
    abbr: 'UX',
    expansion: 'User Experience',
    description: 'The overall experience a user has when using a product',
  },
  FAQ: {
    abbr: 'FAQ',
    expansion: 'Frequently Asked Questions',
    description: 'Common questions and their answers',
  },

  // Privacy & Compliance
  GDPR: {
    abbr: 'GDPR',
    expansion: 'General Data Protection Regulation',
    description: 'European Union data protection law',
  },
  CCPA: {
    abbr: 'CCPA',
    expansion: 'California Consumer Privacy Act',
    description: 'California state privacy law',
  },
  PCI: {
    abbr: 'PCI',
    expansion: 'Payment Card Industry',
    description: 'Standards for secure payment processing',
  },
  DSS: {
    abbr: 'DSS',
    expansion: 'Data Security Standard',
    description: 'Security standards for handling payment card data',
  },

  // Accessibility
  WCAG: {
    abbr: 'WCAG',
    expansion: 'Web Content Accessibility Guidelines',
    description: 'International standards for web accessibility',
  },
  ARIA: {
    abbr: 'ARIA',
    expansion: 'Accessible Rich Internet Applications',
    description: 'Technology for making web content accessible',
  },

  // Security
  JWT: {
    abbr: 'JWT',
    expansion: 'JSON Web Token',
    description: 'A secure way to transmit information between parties',
  },
  CSP: {
    abbr: 'CSP',
    expansion: 'Content Security Policy',
    description: 'A security feature that helps prevent cross-site scripting attacks',
  },
  HSTS: {
    abbr: 'HSTS',
    expansion: 'HTTP Strict Transport Security',
    description: 'A security policy that forces browsers to use HTTPS',
  },
  XSS: {
    abbr: 'XSS',
    expansion: 'Cross-Site Scripting',
    description: 'A type of security vulnerability in web applications',
  },
  CSRF: {
    abbr: 'CSRF',
    expansion: 'Cross-Site Request Forgery',
    description: 'A type of attack that tricks users into performing unwanted actions',
  },
  OWASP: {
    abbr: 'OWASP',
    expansion: 'Open Web Application Security Project',
    description: 'A nonprofit foundation that works to improve software security',
  },

  // Database
  SQL: {
    abbr: 'SQL',
    expansion: 'Structured Query Language',
    description: 'A programming language for managing databases',
  },
  NoSQL: {
    abbr: 'NoSQL',
    expansion: 'Not Only SQL',
    description: "A database that doesn't use traditional SQL structure",
  },

  // Standards Organizations
  RFC: {
    abbr: 'RFC',
    expansion: 'Request for Comments',
    description: 'Documents that define internet standards',
  },
  ISO: {
    abbr: 'ISO',
    expansion: 'International Organization for Standardization',
    description: 'An international standard-setting body',
  },
  IETF: {
    abbr: 'IETF',
    expansion: 'Internet Engineering Task Force',
    description: 'An organization that develops internet standards',
  },
  W3C: {
    abbr: 'W3C',
    expansion: 'World Wide Web Consortium',
    description: 'An international organization that develops web standards',
  },
  ECMA: {
    abbr: 'ECMA',
    expansion: 'European Computer Manufacturers Association',
    description:
      'An organization that develops standards for information and communication systems',
  },

  // Other
  PR: {
    abbr: 'PR',
    expansion: 'Public Relations',
    description: 'The practice of managing communication between an organization and the public',
  },
};

/**
 * Get abbreviation expansion
 * @param abbr - Abbreviation to look up
 * @returns Abbreviation object or null if not found
 */
export function getAbbreviation(abbr: string): Abbreviation | null {
  const upperAbbr = abbr.toUpperCase();
  return ABBREVIATION_DICTIONARY[upperAbbr] || null;
}

/**
 * Check if a string is an abbreviation
 * @param text - Text to check
 * @returns True if text is a known abbreviation
 */
export function isAbbreviation(text: string): boolean {
  return getAbbreviation(text) !== null;
}

/**
 * Mark abbreviations in text with <abbr> tags
 * @param text - Text to process
 * @returns Text with abbreviations marked
 */
export function markAbbreviations(text: string): string {
  let result = text;

  // Sort by length (longest first) to avoid partial matches
  const abbreviations = Object.keys(ABBREVIATION_DICTIONARY).sort((a, b) => b.length - a.length);

  for (const abbr of abbreviations) {
    const abbrev = ABBREVIATION_DICTIONARY[abbr];
    if (!abbrev) continue;
    // Match whole words only (case-insensitive)
    const regex = new RegExp(`\\b${abbr}\\b`, 'gi');
    result = result.replace(regex, match => {
      // Don't replace if already in an <abbr> tag
      if (match.includes('<abbr')) {
        return match;
      }
      return `<abbr title="${abbrev.expansion}${
        abbrev.description ? ` - ${abbrev.description}` : ''
      }" aria-label="${abbrev.expansion}">${match}</abbr>`;
    });
  }

  return result;
}

/**
 * Initialize abbreviation markup on page load
 * Processes all text content and marks abbreviations
 */
export function initAbbreviations(): void {
  if (typeof document === 'undefined') {
    return;
  }

  // Process all text nodes in elements with data-reading-level-content
  const contentElements = document.querySelectorAll('[data-reading-level-content]');

  contentElements.forEach(element => {
    // Process direct text content and child text nodes
    const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT, null);

    const textNodes: Text[] = [];
    let node;
    while ((node = walker.nextNode())) {
      if (node.textContent && node.textContent.trim()) {
        textNodes.push(node as Text);
      }
    }

    textNodes.forEach(textNode => {
      const parent = textNode.parentElement;
      if (!parent || parent.tagName === 'ABBR' || parent.closest('abbr')) {
        return;
      }

      const text = textNode.textContent || '';
      const marked = markAbbreviations(text);

      if (marked !== text) {
        // Create temporary container to parse HTML
        const temp = document.createElement('div');
        temp.innerHTML = marked;

        // Replace text node with new content
        const fragment = document.createDocumentFragment();
        while (temp.firstChild) {
          fragment.appendChild(temp.firstChild);
        }

        parent.replaceChild(fragment, textNode);
      }
    });
  });
}
