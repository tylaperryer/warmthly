/**
 * Glossary and Definitions Utility
 * Provides definitions for unusual words and technical terms
 *
 * WCAG 2.1 AAA Success Criterion 3.1.3 - Unusual Words
 */

import { sanitizeHtml } from '@utils/sanitize.js';

export interface GlossaryTerm {
  term: string;
  definition: string;
  simplified?: string; // Simplified definition for reading levels
  category?: string;
}

/**
 * Comprehensive glossary dictionary
 * Maps terms to their definitions
 */
export const GLOSSARY_DICTIONARY: Record<string, GlossaryTerm> = {
  // Core Concepts
  empathy: {
    term: 'empathy',
    definition: 'The ability to understand and share the feelings of another person.',
    simplified: 'Understanding how someone else feels.',
    category: 'Core Concept',
  },
  rehumanize: {
    term: 'rehumanize',
    definition:
      'To restore human qualities, dignity, and empathy to systems and processes that have become too focused on numbers and efficiency.',
    simplified: 'To make systems care about people again.',
    category: 'Core Concept',
  },
  'radical transparency': {
    term: 'radical transparency',
    definition:
      'Complete openness about all operations, decisions, and financial transactions, allowing full public scrutiny.',
    simplified: 'Being completely open about everything we do.',
    category: 'Core Concept',
  },
  'dissolution vote': {
    term: 'dissolution vote',
    definition:
      'A community vote to decide whether Warmthly should continue operating. If the vote count reaches 100,000, it triggers a formal process to dissolve the organization.',
    simplified: 'A vote to decide if Warmthly should continue.',
    category: 'Process',
  },
  transparency: {
    term: 'transparency',
    definition:
      'The practice of being open and honest about operations, decisions, and financial matters.',
    simplified: 'Being open and honest.',
    category: 'Core Concept',
  },
  accountability: {
    term: 'accountability',
    definition: 'The obligation to explain and justify actions and decisions.',
    simplified: 'Taking responsibility for what we do.',
    category: 'Core Concept',
  },
  humility: {
    term: 'humility',
    definition:
      'The quality of being modest and respectful, not thinking you are better than others.',
    simplified: 'Being modest and respectful.',
    category: 'Value',
  },
  honesty: {
    term: 'honesty',
    definition: 'The quality of being truthful and straightforward.',
    simplified: 'Telling the truth.',
    category: 'Value',
  },

  // Technical Terms
  'proof-of-concept': {
    term: 'proof-of-concept',
    definition: 'A demonstration that shows an idea or method is feasible and works in practice.',
    simplified: 'A test to show an idea works.',
    category: 'Technical',
  },
  pilot: {
    term: 'pilot',
    definition:
      'A small-scale test or trial of a new program or approach before full implementation.',
    simplified: 'A small test before doing something bigger.',
    category: 'Technical',
  },
  bylaws: {
    term: 'bylaws',
    definition: 'The rules and regulations that govern how an organization operates.',
    simplified: 'The rules for how we work.',
    category: 'Legal',
  },
  'successor charity': {
    term: 'successor charity',
    definition:
      'A charity organization that receives assets and continues the mission if the original organization dissolves.',
    simplified: 'Another charity that would continue our work if we stop.',
    category: 'Legal',
  },
  'kill switch': {
    term: 'kill switch',
    definition:
      'A mechanism that allows the community to shut down the organization if it fails to uphold its values.',
    simplified: 'A way for the community to stop us if we fail.',
    category: 'Process',
  },
};

/**
 * Get glossary term definition
 * @param term - Term to look up
 * @returns Glossary term object or null if not found
 */
export function getGlossaryTerm(term: string): GlossaryTerm | null {
  const lowerTerm = term.toLowerCase().trim();
  return GLOSSARY_DICTIONARY[lowerTerm] || null;
}

/**
 * Check if a word is in the glossary
 * @param word - Word to check
 * @returns True if word is in glossary
 */
export function isGlossaryTerm(word: string): boolean {
  return getGlossaryTerm(word) !== null;
}

/**
 * Get simplified definition for reading level
 * @param term - Term to look up
 * @param readingLevel - Current reading level
 * @returns Simplified definition if available, otherwise regular definition
 */
export function getDefinitionForReadingLevel(
  term: string,
  readingLevel: 'standard' | 'simplified' | 'easy-read' = 'standard'
): string | null {
  const glossaryTerm = getGlossaryTerm(term);
  if (!glossaryTerm) {
    return null;
  }

  if (readingLevel === 'simplified' || readingLevel === 'easy-read') {
    return glossaryTerm.simplified || glossaryTerm.definition;
  }

  return glossaryTerm.definition;
}

/**
 * Mark glossary terms in text with definition links
 * @param text - Text to process
 * @returns Text with glossary terms marked
 */
export function markGlossaryTerms(text: string): string {
  let result = text;

  // Sort by length (longest first) to avoid partial matches
  const terms = Object.keys(GLOSSARY_DICTIONARY).sort((a, b) => b.length - a.length);

  for (const term of terms) {
    const glossaryTerm = GLOSSARY_DICTIONARY[term];
    if (!glossaryTerm) continue;
    // Match whole words only (case-insensitive)
    const regex = new RegExp(`\\b${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
    result = result.replace(regex, match => {
      // Don't replace if already in a definition link
      if (match.includes('data-glossary-term')) {
        return match;
      }
      return `<span data-glossary-term="${glossaryTerm.term}" title="${glossaryTerm.definition}" aria-label="${glossaryTerm.term}: ${glossaryTerm.definition}">${match}</span>`;
    });
  }

  return result;
}

/**
 * Initialize glossary markup on page load
 * Processes all text content and marks glossary terms
 */
export function initGlossary(): void {
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
      if (
        !parent ||
        parent.hasAttribute('data-glossary-term') ||
        parent.closest('[data-glossary-term]')
      ) {
        return;
      }

      // Exclude title element, head elements, h1 elements, and elements with data-no-glossary from glossary processing
      if (
        parent.tagName === 'TITLE' ||
        parent.tagName === 'H1' ||
        parent.closest('head') ||
        parent.closest('title') ||
        parent.hasAttribute('data-no-glossary') ||
        parent.closest('[data-no-glossary]')
      ) {
        return;
      }

      const text = textNode.textContent || '';
      const marked = markGlossaryTerms(text);

      if (marked !== text) {
        // SECURITY: Sanitize HTML before using innerHTML to prevent XSS
        const sanitized = sanitizeHtml(marked);
        // Create temporary container to parse HTML
        const temp = document.createElement('div');
        temp.innerHTML = sanitized;

        // Replace text node with new content
        const fragment = document.createDocumentFragment();
        while (temp.firstChild) {
          fragment.appendChild(temp.firstChild);
        }

        parent.replaceChild(fragment, textNode);
      }
    });
  });

  // Add click handlers for glossary terms
  const glossaryTerms = document.querySelectorAll('[data-glossary-term]');
  glossaryTerms.forEach(term => {
    term.addEventListener('click', e => {
      e.preventDefault();
      const termName = term.getAttribute('data-glossary-term');
      if (termName) {
        const glossaryTerm = getGlossaryTerm(termName);
        if (glossaryTerm) {
          showGlossaryTooltip(term as HTMLElement, glossaryTerm);
        }
      }
    });

    // Add keyboard support
    term.setAttribute('tabindex', '0');
    term.setAttribute('role', 'button');
    term.addEventListener('keydown', (e: Event) => {
      const keyEvent = e as KeyboardEvent;
      if (keyEvent.key === 'Enter' || keyEvent.key === ' ') {
        keyEvent.preventDefault();
        (term as HTMLElement).click();
      }
    });
  });
}

/**
 * Show glossary tooltip
 * @param element - Element that triggered the tooltip
 * @param term - Glossary term to display
 */
function showGlossaryTooltip(element: HTMLElement, term: GlossaryTerm): void {
  // Remove existing tooltip
  const existing = document.querySelector('.glossary-tooltip');
  if (existing) {
    existing.remove();
  }

  // Create tooltip
  const tooltip = document.createElement('div');
  tooltip.className = 'glossary-tooltip';
  tooltip.setAttribute('role', 'dialog');
  tooltip.setAttribute('aria-label', `Definition of ${term.term}`);
  // SECURITY: Use DOM methods instead of innerHTML to prevent XSS
  tooltip.textContent = ''; // Clear existing content

  const closeBtn = document.createElement('button');
  closeBtn.className = 'glossary-tooltip-close';
  closeBtn.setAttribute('aria-label', 'Close definition');
  closeBtn.textContent = '×';

  const heading = document.createElement('h3');
  heading.textContent = term.term;

  const definition = document.createElement('p');
  definition.textContent = term.definition;

  tooltip.appendChild(closeBtn);
  tooltip.appendChild(heading);
  tooltip.appendChild(definition);

  if (term.simplified) {
    const simplified = document.createElement('p');
    simplified.className = 'glossary-simplified';
    const strong = document.createElement('strong');
    strong.textContent = 'Simple: ';
    simplified.appendChild(strong);
    simplified.appendChild(document.createTextNode(term.simplified));
    tooltip.appendChild(simplified);
  }

  // Position tooltip
  const rect = element.getBoundingClientRect();
  tooltip.style.position = 'fixed';
  tooltip.style.top = `${rect.bottom + 10}px`;
  tooltip.style.left = `${rect.left}px`;
  tooltip.style.zIndex = '999999';

  document.body.appendChild(tooltip);

  // Close button handler (use the closeBtn we already created)
  closeBtn.addEventListener('click', () => tooltip.remove());

  // Close on outside click
  setTimeout(() => {
    document.addEventListener('click', function closeOnOutsideClick(e: MouseEvent) {
      if (!tooltip.contains(e.target as Node)) {
        tooltip.remove();
        document.removeEventListener('click', closeOnOutsideClick);
      }
    });
  }, 0);

  // Focus management
  (closeBtn as HTMLElement)?.focus();
}
