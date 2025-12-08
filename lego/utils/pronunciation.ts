export interface Pronunciation {
  word: string;
  phonetic: string;
  audioUrl?: string;
  context?: string;
}

export const PRONUNCIATION_DICTIONARY: Record<string, Pronunciation> = {
  read: {
    word: 'read',
    phonetic: '/riːd/ (present) or /rɛd/ (past)',
    context: 'Can be pronounced as "reed" (present tense) or "red" (past tense)',
  },
  lead: {
    word: 'lead',
    phonetic: '/liːd/ (verb) or /lɛd/ (metal)',
    context: 'Can be pronounced as "leed" (to guide) or "led" (the metal)',
  },
  tear: {
    word: 'tear',
    phonetic: '/tɪər/ (cry) or /tɛər/ (rip)',
    context: 'Can be pronounced as "teer" (from eye) or "tair" (to rip)',
  },
  wind: {
    word: 'wind',
    phonetic: '/wɪnd/ (air) or /waɪnd/ (turn)',
    context: 'Can be pronounced as "wind" (air) or "wynd" (to turn)',
  },
  record: {
    word: 'record',
    phonetic: '/ˈrɛkɔːrd/ (noun) or /rɪˈkɔːrd/ (verb)',
    context: 'Can be pronounced as "REK-ord" (noun) or "ri-KORD" (verb)',
  },
  present: {
    word: 'present',
    phonetic: '/ˈprɛzənt/ (noun/adj) or /prɪˈzɛnt/ (verb)',
    context: 'Can be pronounced as "PREZ-ent" (noun/adjective) or "pri-ZENT" (verb)',
  },
  content: {
    word: 'content',
    phonetic: '/ˈkɒntɛnt/ (noun) or /kənˈtɛnt/ (adj)',
    context: 'Can be pronounced as "KON-tent" (noun) or "kon-TENT" (adjective)',
  },
  project: {
    word: 'project',
    phonetic: '/ˈprɒdʒɛkt/ (noun) or /prəˈdʒɛkt/ (verb)',
    context: 'Can be pronounced as "PROJ-ekt" (noun) or "pro-JEKT" (verb)',
  },
  produce: {
    word: 'produce',
    phonetic: '/ˈprɒdjuːs/ (noun) or /prəˈdjuːs/ (verb)',
    context: 'Can be pronounced as "PROD-yoos" (noun) or "pro-DYOOS" (verb)',
  },
  object: {
    word: 'object',
    phonetic: '/ˈɒbdʒɛkt/ (noun) or /əbˈdʒɛkt/ (verb)',
    context: 'Can be pronounced as "OB-jekt" (noun) or "ob-JEKT" (verb)',
  },
  data: {
    word: 'data',
    phonetic: '/ˈdeɪtə/ or /ˈdætə/',
    context: 'Can be pronounced as "DAY-tuh" or "DAT-uh"',
  },
  route: {
    word: 'route',
    phonetic: '/ruːt/ or /raʊt/',
    context: 'Can be pronounced as "root" or "rout"',
  },
  resume: {
    word: 'resume',
    phonetic: '/rɪˈzuːm/ (verb) or /ˈrɛzjʊmeɪ/ (noun)',
    context: 'Can be pronounced as "ri-ZOOM" (verb) or "REZ-yoo-may" (noun)',
  },
};

export function getPronunciation(word: string): Pronunciation | null {
  const lowerWord = word.toLowerCase().trim();
  return PRONUNCIATION_DICTIONARY[lowerWord] || null;
}

export function hasPronunciation(word: string): boolean {
  return getPronunciation(word) !== null;
}

export function markPronunciations(text: string): string {
  let result = text;

  const words = Object.keys(PRONUNCIATION_DICTIONARY).sort((a, b) => b.length - a.length);

  for (const word of words) {
    const pronunciation = PRONUNCIATION_DICTIONARY[word];
    if (!pronunciation) continue;
    const regex = new RegExp(`\\b${word}\\b`, 'gi');
    result = result.replace(regex, match => {
      if (match.includes('data-pronunciation')) {
        return match;
      }
      return `<span data-pronunciation="${pronunciation.word}" data-phonetic="${
        pronunciation.phonetic
      }" title="${pronunciation.phonetic}${
        pronunciation.context ? ` - ${pronunciation.context}` : ''
      }" aria-label="${match}: ${pronunciation.phonetic}">${match}</span>`;
    });
  }

  return result;
}

export function initPronunciation(): void {
  if (typeof document === 'undefined') {
    return;
  }

  const contentElements = document.querySelectorAll('[data-reading-level-content]');

  contentElements.forEach(element => {
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
        parent.hasAttribute('data-pronunciation') ||
        parent.closest('[data-pronunciation]')
      ) {
        return;
      }

      const text = textNode.textContent || '';
      const marked = markPronunciations(text);

      if (marked !== text) {
        const temp = document.createElement('div');
        temp.innerHTML = marked;

        const fragment = document.createDocumentFragment();
        while (temp.firstChild) {
          fragment.appendChild(temp.firstChild);
        }

        parent.replaceChild(fragment, textNode);
      }
    });
  });

  const pronunciationTerms = document.querySelectorAll('[data-pronunciation]');
  pronunciationTerms.forEach(term => {
    term.addEventListener('click', e => {
      e.preventDefault();
      const word = term.getAttribute('data-pronunciation');
      const phonetic = term.getAttribute('data-phonetic');
      if (word && phonetic) {
        showPronunciationTooltip(term as HTMLElement, word, phonetic);
      }
    });

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

function showPronunciationTooltip(element: HTMLElement, word: string, phonetic: string): void {
  const existing = document.querySelector('.pronunciation-tooltip');
  if (existing) {
    existing.remove();
  }

  const pronunciation = getPronunciation(word);

  // Escape HTML to prevent XSS
  const escapeHtml = (text: string): string => {
    const div = document.createElement('div');
    div.textContent = text;
    return div.textContent || '';
  };
  const escapeHtmlAttribute = (value: string): string => {
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  };

  const tooltip = document.createElement('div');
  tooltip.className = 'pronunciation-tooltip';
  tooltip.setAttribute('role', 'dialog');
  tooltip.setAttribute('aria-label', `Pronunciation of ${escapeHtml(word)}`);
  
  // Use DOM methods instead of innerHTML for better security
  const closeButton = document.createElement('button');
  closeButton.className = 'pronunciation-tooltip-close';
  closeButton.setAttribute('aria-label', 'Close pronunciation');
  closeButton.textContent = '×';
  tooltip.appendChild(closeButton);

  const heading = document.createElement('h3');
  heading.textContent = word;
  tooltip.appendChild(heading);

  const phoneticP = document.createElement('p');
  phoneticP.className = 'phonetic';
  phoneticP.textContent = phonetic;
  tooltip.appendChild(phoneticP);

  if (pronunciation?.context) {
    const contextP = document.createElement('p');
    contextP.className = 'pronunciation-context';
    contextP.textContent = pronunciation.context;
    tooltip.appendChild(contextP);
  }

  if (pronunciation?.audioUrl) {
    const audio = document.createElement('audio');
    audio.controls = true;
    const source = document.createElement('source');
    source.src = escapeHtmlAttribute(pronunciation.audioUrl);
    source.type = 'audio/mpeg';
    audio.appendChild(source);
    tooltip.appendChild(audio);
  }

  const rect = element.getBoundingClientRect();
  tooltip.style.position = 'fixed';
  tooltip.style.top = `${rect.bottom + 10}px`;
  tooltip.style.left = `${rect.left}px`;
  tooltip.style.zIndex = '999999';

  document.body.appendChild(tooltip);

  const closeBtn = tooltip.querySelector('.pronunciation-tooltip-close');
  if (closeBtn) {
    closeBtn.addEventListener('click', () => tooltip.remove());
  }

  setTimeout(() => {
    document.addEventListener('click', function closeOnOutsideClick(e: MouseEvent) {
      if (!tooltip.contains(e.target as Node)) {
        tooltip.remove();
        document.removeEventListener('click', closeOnOutsideClick);
      }
    });
  }, 0);

  (closeBtn as HTMLElement)?.focus();
}
