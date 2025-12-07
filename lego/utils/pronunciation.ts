/**
 * Pronunciation Utility
 * Provides pronunciation information for ambiguous words
 * 
 * WCAG 2.1 AAA Success Criterion 3.1.6 - Pronunciation
 */

export interface Pronunciation {
  word: string;
  phonetic: string;
  audioUrl?: string;
  context?: string; // Context where pronunciation is ambiguous
}

/**
 * Dictionary of words that may be ambiguous without pronunciation
 * Focus on homographs (words spelled the same but pronounced differently)
 */
export const PRONUNCIATION_DICTIONARY: Record<string, Pronunciation> = {
  // Common homographs
  'read': {
    word: 'read',
    phonetic: '/riːd/ (present) or /rɛd/ (past)',
    context: 'Can be pronounced as "reed" (present tense) or "red" (past tense)'
  },
  'lead': {
    word: 'lead',
    phonetic: '/liːd/ (verb) or /lɛd/ (metal)',
    context: 'Can be pronounced as "leed" (to guide) or "led" (the metal)'
  },
  'tear': {
    word: 'tear',
    phonetic: '/tɪər/ (cry) or /tɛər/ (rip)',
    context: 'Can be pronounced as "teer" (from eye) or "tair" (to rip)'
  },
  'wind': {
    word: 'wind',
    phonetic: '/wɪnd/ (air) or /waɪnd/ (turn)',
    context: 'Can be pronounced as "wind" (air) or "wynd" (to turn)'
  },
  'record': {
    word: 'record',
    phonetic: '/ˈrɛkɔːrd/ (noun) or /rɪˈkɔːrd/ (verb)',
    context: 'Can be pronounced as "REK-ord" (noun) or "ri-KORD" (verb)'
  },
  'present': {
    word: 'present',
    phonetic: '/ˈprɛzənt/ (noun/adj) or /prɪˈzɛnt/ (verb)',
    context: 'Can be pronounced as "PREZ-ent" (noun/adjective) or "pri-ZENT" (verb)'
  },
  'content': {
    word: 'content',
    phonetic: '/ˈkɒntɛnt/ (noun) or /kənˈtɛnt/ (adj)',
    context: 'Can be pronounced as "KON-tent" (noun) or "kon-TENT" (adjective)'
  },
  'project': {
    word: 'project',
    phonetic: '/ˈprɒdʒɛkt/ (noun) or /prəˈdʒɛkt/ (verb)',
    context: 'Can be pronounced as "PROJ-ekt" (noun) or "pro-JEKT" (verb)'
  },
  'produce': {
    word: 'produce',
    phonetic: '/ˈprɒdjuːs/ (noun) or /prəˈdjuːs/ (verb)',
    context: 'Can be pronounced as "PROD-yoos" (noun) or "pro-DYOOS" (verb)'
  },
  'object': {
    word: 'object',
    phonetic: '/ˈɒbdʒɛkt/ (noun) or /əbˈdʒɛkt/ (verb)',
    context: 'Can be pronounced as "OB-jekt" (noun) or "ob-JEKT" (verb)'
  },
  
  // Technical terms that may be ambiguous
  'data': {
    word: 'data',
    phonetic: '/ˈdeɪtə/ or /ˈdætə/',
    context: 'Can be pronounced as "DAY-tuh" or "DAT-uh"'
  },
  'route': {
    word: 'route',
    phonetic: '/ruːt/ or /raʊt/',
    context: 'Can be pronounced as "root" or "rout"'
  },
  'resume': {
    word: 'resume',
    phonetic: '/rɪˈzuːm/ (verb) or /ˈrɛzjʊmeɪ/ (noun)',
    context: 'Can be pronounced as "ri-ZOOM" (verb) or "REZ-yoo-may" (noun)'
  },
};

/**
 * Get pronunciation for a word
 * @param word - Word to look up
 * @returns Pronunciation object or null if not found
 */
export function getPronunciation(word: string): Pronunciation | null {
  const lowerWord = word.toLowerCase().trim();
  return PRONUNCIATION_DICTIONARY[lowerWord] || null;
}

/**
 * Check if a word has pronunciation information
 * @param word - Word to check
 * @returns True if word has pronunciation information
 */
export function hasPronunciation(word: string): boolean {
  return getPronunciation(word) !== null;
}

/**
 * Mark words with pronunciation in text
 * @param text - Text to process
 * @returns Text with pronunciation markers
 */
export function markPronunciations(text: string): string {
  let result = text;
  
  // Sort by length (longest first) to avoid partial matches
  const words = Object.keys(PRONUNCIATION_DICTIONARY).sort((a, b) => b.length - a.length);
  
  for (const word of words) {
    const pronunciation = PRONUNCIATION_DICTIONARY[word];
    // Match whole words only (case-insensitive)
    const regex = new RegExp(`\\b${word}\\b`, 'gi');
    result = result.replace(regex, (match) => {
      // Don't replace if already marked
      if (match.includes('data-pronunciation')) {
        return match;
      }
      return `<span data-pronunciation="${pronunciation.word}" data-phonetic="${pronunciation.phonetic}" title="${pronunciation.phonetic}${pronunciation.context ? ` - ${pronunciation.context}` : ''}" aria-label="${match}: ${pronunciation.phonetic}">${match}</span>`;
    });
  }
  
  return result;
}

/**
 * Initialize pronunciation markup on page load
 * Processes all text content and marks words with pronunciation
 */
export function initPronunciation(): void {
  if (typeof document === 'undefined') {
    return;
  }

  // Process all text nodes in elements with data-reading-level-content
  const contentElements = document.querySelectorAll('[data-reading-level-content]');
  
  contentElements.forEach((element) => {
    // Process direct text content and child text nodes
    const walker = document.createTreeWalker(
      element,
      NodeFilter.SHOW_TEXT,
      null
    );
    
    const textNodes: Text[] = [];
    let node;
    while ((node = walker.nextNode())) {
      if (node.textContent && node.textContent.trim()) {
        textNodes.push(node as Text);
      }
    }
    
    textNodes.forEach((textNode) => {
      const parent = textNode.parentElement;
      if (!parent || parent.hasAttribute('data-pronunciation') || parent.closest('[data-pronunciation]')) {
        return;
      }
      
      const text = textNode.textContent || '';
      const marked = markPronunciations(text);
      
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
  
  // Add click handlers for pronunciation terms
  const pronunciationTerms = document.querySelectorAll('[data-pronunciation]');
  pronunciationTerms.forEach((term) => {
    term.addEventListener('click', (e) => {
      e.preventDefault();
      const word = term.getAttribute('data-pronunciation');
      const phonetic = term.getAttribute('data-phonetic');
      if (word && phonetic) {
        showPronunciationTooltip(term as HTMLElement, word, phonetic);
      }
    });
    
    // Add keyboard support
    term.setAttribute('tabindex', '0');
    term.setAttribute('role', 'button');
    const phoneticAttr = term.getAttribute('data-phonetic') || '';
    term.setAttribute('aria-label', `${term.textContent}: ${phoneticAttr}`);
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
 * Show pronunciation tooltip
 * @param element - Element that triggered the tooltip
 * @param word - Word to display
 * @param phonetic - Phonetic spelling
 */
function showPronunciationTooltip(element: HTMLElement, word: string, phonetic: string): void {
  // Remove existing tooltip
  const existing = document.querySelector('.pronunciation-tooltip');
  if (existing) {
    existing.remove();
  }
  
  const pronunciation = getPronunciation(word);
  
  // Create tooltip
  const tooltip = document.createElement('div');
  tooltip.className = 'pronunciation-tooltip';
  tooltip.setAttribute('role', 'dialog');
  tooltip.setAttribute('aria-label', `Pronunciation of ${word}`);
  tooltip.innerHTML = `
    <button class="pronunciation-tooltip-close" aria-label="Close pronunciation">×</button>
    <h3>${word}</h3>
    <p class="phonetic">${phonetic}</p>
    ${pronunciation?.context ? `<p class="pronunciation-context">${pronunciation.context}</p>` : ''}
    ${pronunciation?.audioUrl ? `<audio controls><source src="${pronunciation.audioUrl}" type="audio/mpeg"></audio>` : ''}
  `;
  
  // Position tooltip
  const rect = element.getBoundingClientRect();
  tooltip.style.position = 'fixed';
  tooltip.style.top = `${rect.bottom + 10}px`;
  tooltip.style.left = `${rect.left}px`;
  tooltip.style.zIndex = '999999';
  
  document.body.appendChild(tooltip);
  
  // Close button handler
  const closeBtn = tooltip.querySelector('.pronunciation-tooltip-close');
  if (closeBtn) {
    closeBtn.addEventListener('click', () => tooltip.remove());
  }
  
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

