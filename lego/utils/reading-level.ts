export type ReadingLevel = 'standard' | 'simplified' | 'easy-read';

export interface ReadingLevelConfig {
  level: ReadingLevel;
  maxWordsPerSentence: number;
  maxSyllablesPerWord: number;
  useSimpleWords: boolean;
  usePictures: boolean;
  maxParagraphLength: number;
}

export const READING_LEVELS: Record<ReadingLevel, ReadingLevelConfig> = {
  standard: {
    level: 'standard',
    maxWordsPerSentence: 25,
    maxSyllablesPerWord: 4,
    useSimpleWords: false,
    usePictures: false,
    maxParagraphLength: 150,
  },
  simplified: {
    level: 'simplified',
    maxWordsPerSentence: 15,
    maxSyllablesPerWord: 3,
    useSimpleWords: true,
    usePictures: false,
    maxParagraphLength: 100,
  },
  'easy-read': {
    level: 'easy-read',
    maxWordsPerSentence: 10,
    maxSyllablesPerWord: 2,
    useSimpleWords: true,
    usePictures: true,
    maxParagraphLength: 50,
  },
};

const WORD_SIMPLIFICATIONS: Record<string, string> = {
  demonstrate: 'show',
  utilize: 'use',
  facilitate: 'help',
  implement: 'do',
  approximately: 'about',
  significant: 'important',
  substantial: 'large',
  comprehensive: 'complete',
  establish: 'set up',
  maintain: 'keep',
  obtain: 'get',
  acquire: 'get',
  require: 'need',
  necessitate: 'need',
  indicate: 'show',
  illustrate: 'show',
  exemplify: 'show',
  represent: 'stand for',
  constitute: 'are',
  comprise: 'are',
  incorporate: 'include',
  integrate: 'add',
  optimize: 'improve',
  enhance: 'make better',
  maximize: 'make bigger',
  minimize: 'make smaller',
  prioritize: 'focus on',
  emphasize: 'focus on',
  acknowledge: 'know',
  recognize: 'know',
  comprehend: 'understand',
  perceive: 'see',
  determine: 'find',
  ascertain: 'find',
  evaluate: 'check',
  assess: 'check',
  analyze: 'look at',
  examine: 'look at',
  investigate: 'look at',
  consider: 'think about',
  contemplate: 'think about',
  enable: 'help',
  empower: 'help',
  support: 'help',
  assist: 'help',
  aid: 'help',
  collaborate: 'work together',
  cooperate: 'work together',
  coordinate: 'organize',
  organize: 'arrange',
  structure: 'arrange',
  develop: 'grow',
  create: 'make',
  generate: 'make',
  produce: 'make',
  manufacture: 'make',
  construct: 'build',
  initiate: 'start',
  commence: 'start',
  begin: 'start',
  terminate: 'end',
  conclude: 'end',
  finalize: 'finish',
  complete: 'finish',
  accomplish: 'do',
  achieve: 'do',
  attain: 'get',
  secure: 'get',
  procure: 'get',
  purchase: 'buy',
  receive: 'get',
  retrieve: 'get',
  recover: 'get back',
  restore: 'fix',
  repair: 'fix',
  preserve: 'keep',
  sustain: 'keep',
  continue: 'keep going',
  proceed: 'go on',
  advance: 'move forward',
  progress: 'move forward',
  improve: 'get better',
  upgrade: 'make better',
  refine: 'make better',
  reduce: 'make smaller',
  decrease: 'make smaller',
  increase: 'make bigger',
  expand: 'make bigger',
  extend: 'make longer',
  lengthen: 'make longer',
  shorten: 'make shorter',
  abbreviate: 'make shorter',
  simplify: 'make easier',
  clarify: 'make clear',
  explain: 'tell about',
  describe: 'tell about',
  detail: 'tell about',
  specify: 'tell exactly',
  define: 'tell what it is',
  identify: 'find',
  locate: 'find',
  discover: 'find',
  uncover: 'find',
  reveal: 'show',
  expose: 'show',
  display: 'show',
  present: 'show',
  exhibit: 'show',
  signify: 'mean',
  symbolize: 'stand for',
  denote: 'mean',
  imply: 'mean',
  suggest: 'mean',
  verify: 'check',
  confirm: 'check',
  validate: 'check',
  authenticate: 'check',
  authorize: 'allow',
  permit: 'allow',
  strengthen: 'make stronger',
  reinforce: 'make stronger',
  bolster: 'make stronger',
  fortify: 'make stronger',
  perfect: 'make perfect',
  polish: 'make better',
  hone: 'make better',
  sharpen: 'make better',
  evolve: 'change',
  transform: 'change',
  modify: 'change',
  alter: 'change',
  adjust: 'change',
  adapt: 'change',
  accommodate: 'fit',
  conform: 'fit',
  comply: 'follow',
  adhere: 'follow',
  abide: 'follow',
  obey: 'follow',
  follow: 'do',
  execute: 'do',
  perform: 'do',
  conduct: 'do',
  'carry out': 'do',
  enact: 'do',
  enforce: 'make happen',
  apply: 'use',
  employ: 'use',
  operate: 'work',
  function: 'work',
  run: 'work',
};

function countSyllables(word: string): number {
  word = word.toLowerCase().trim();
  if (word.length <= 3) return 1;

  word = word.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '');
  word = word.replace(/^y/, '');

  const matches = word.match(/[aeiouy]{1,2}/g);
  return matches ? matches.length : 1;
}

function countWords(sentence: string): number {
  return sentence
    .trim()
    .split(/\s+/)
    .filter(w => w.length > 0).length;
}

function simplifyWord(word: string, config: ReadingLevelConfig): string {
  if (!config.useSimpleWords) return word;

  const lowerWord = word.toLowerCase().replace(/[.,!?;:]/g, '');
  const simplified = WORD_SIMPLIFICATIONS[lowerWord];

  if (simplified) {
    if (word && word[0] && word[0] === word[0].toUpperCase()) {
      return simplified.charAt(0).toUpperCase() + simplified.slice(1);
    }
    return simplified;
  }

  return word;
}

function breakLongSentences(text: string, config: ReadingLevelConfig): string {
  const sentences = text.split(/([.!?]+)/);
  const result: string[] = [];

  for (let i = 0; i < sentences.length; i += 2) {
    const sentence = sentences[i];
    const punctuation = sentences[i + 1] || '';

    if (!sentence) continue;

    const wordCount = countWords(sentence);

    if (wordCount <= config.maxWordsPerSentence) {
      result.push(sentence + punctuation);
    } else {
      const parts = sentence.split(/(\s+and\s+|\s+or\s+|\s+but\s+|,\s+)/i);
      let currentSentence = '';

      for (const part of parts) {
        const testSentence = (currentSentence + part).trim();
        const testWordCount = countWords(testSentence);

        if (testWordCount <= config.maxWordsPerSentence) {
          currentSentence = testSentence;
        } else {
          if (currentSentence) {
            result.push(currentSentence + '.');
          }
          currentSentence = part.trim();
        }
      }

      if (currentSentence) {
        result.push(currentSentence + punctuation);
      }
    }
  }

  return result.join(' ').replace(/\s+/g, ' ').trim();
}

function simplifyWords(text: string, config: ReadingLevelConfig): string {
  if (!config.useSimpleWords) return text;

  const words = text.split(/(\s+|[.,!?;:])/);

  return words
    .map(word => {
      const cleanWord = word.replace(/[.,!?;:]/g, '');
      if (cleanWord.length === 0) return word;

      const syllables = countSyllables(cleanWord);
      if (syllables > config.maxSyllablesPerWord) {
        return simplifyWord(word, config);
      }

      return simplifyWord(word, config);
    })
    .join('');
}

export function transformReadingLevel(text: string, targetLevel: ReadingLevel): string {
  if (!text || typeof text !== 'string') return text;

  const config = READING_LEVELS[targetLevel];
  if (!config) return text;

  let transformed = breakLongSentences(text, config);

  transformed = simplifyWords(transformed, config);

  const paragraphs = transformed.split(/\n\n+/);
  const simplifiedParagraphs = paragraphs.map(para => {
    const words = countWords(para);
    if (words > config.maxParagraphLength) {
      const sentences = para.split(/([.!?]+)/);
      const chunks: string[] = [];
      let currentChunk = '';

      for (let i = 0; i < sentences.length; i += 2) {
        const sentence = sentences[i];
        const punctuation = sentences[i + 1] || '';
        const testChunk = (currentChunk + sentence + punctuation).trim();

        if (countWords(testChunk) <= config.maxParagraphLength) {
          currentChunk = testChunk;
        } else {
          if (currentChunk) chunks.push(currentChunk);
          currentChunk = sentence + punctuation;
        }
      }

      if (currentChunk) chunks.push(currentChunk);
      return chunks.join('\n\n');
    }
    return para;
  });

  return simplifiedParagraphs.join('\n\n');
}

export function getReadingLevel(): ReadingLevel {
  if (typeof localStorage === 'undefined') return 'standard';

  const stored = localStorage.getItem('warmthly-reading-level');
  if (stored && (stored === 'standard' || stored === 'simplified' || stored === 'easy-read')) {
    return stored as ReadingLevel;
  }

  return 'standard';
}

export function setReadingLevel(level: ReadingLevel): void {
  if (typeof localStorage === 'undefined') return;

  localStorage.setItem('warmthly-reading-level', level);

  window.dispatchEvent(new CustomEvent('readinglevelchange', { detail: { level } }));
}

export function applyReadingLevelToDOM(level: ReadingLevel): void {
  const elements = document.querySelectorAll('[data-reading-level-content]');

  elements.forEach(element => {
    const originalText = element.getAttribute('data-original-text') || element.textContent || '';

    if (!element.getAttribute('data-original-text')) {
      element.setAttribute('data-original-text', originalText);
    }

    if (level === 'standard') {
      element.textContent = element.getAttribute('data-original-text') || '';
    } else {
      const transformed = transformReadingLevel(originalText, level);
      element.textContent = transformed;
    }

    element.setAttribute('data-reading-level', level);
  });

  document.body.classList.remove(
    'reading-level-standard',
    'reading-level-simplified',
    'reading-level-easy-read'
  );
  document.body.classList.add(`reading-level-${level}`);
}

export function initReadingLevel(): void {
  const level = getReadingLevel();
  applyReadingLevelToDOM(level);

  window.addEventListener('readinglevelchange', ((e: CustomEvent) => {
    applyReadingLevelToDOM(e.detail.level);
  }) as EventListener);
}
