/**
 * TypeScript Types for i18n Translations
 * Generated from JSON Schema - provides type-safe access to translations
 * 
 * Usage:
 * ```typescript
 * import type { TranslationKeys, TranslationStructure } from '@lego/i18n/types';
 * 
 * const key: TranslationKeys = 'common.loading'; // Type-safe!
 * ```
 */

/**
 * Translation key paths (dot-notation)
 * All valid translation keys in the system
 */
export type TranslationKeys =
  // Common keys
  | 'common.loading'
  | 'common.error'
  | 'common.success'
  | 'common.cancel'
  | 'common.submit'
  | 'common.close'
  | 'common.back'
  | 'common.next'
  | 'common.save'
  | 'common.delete'
  | 'common.edit'
  | 'common.view'
  | 'common.search'
  | 'common.filter'
  | 'common.sort'
  | 'common.language'
  // Main keys
  | 'main.title'
  | 'main.subtitle'
  | 'main.donate'
  | 'main.donateButton'
  // Mint keys
  | 'mint.title'
  | 'mint.description'
  // Post keys
  | 'post.title'
  | 'post.subtitle'
  // Vote keys
  | 'vote.title'
  | 'vote.description'
  // Report keys
  | 'report.title'
  | 'report.description'
  // YourData keys
  | 'yourData.title'
  | 'yourData.description';

/**
 * Translation structure type
 * Matches the JSON Schema structure
 */
export interface TranslationStructure {
  readonly common: {
    readonly loading: string;
    readonly error: string;
    readonly success: string;
    readonly cancel: string;
    readonly submit: string;
    readonly close: string;
    readonly back: string;
    readonly next: string;
    readonly save: string;
    readonly delete: string;
    readonly edit: string;
    readonly view: string;
    readonly search: string;
    readonly filter: string;
    readonly sort: string;
    readonly language: string;
  };
  readonly main: {
    readonly title: string;
    readonly subtitle: string;
    readonly donate: string;
    readonly donateButton: string;
  };
  readonly mint: {
    readonly title: string;
    readonly description: string;
  };
  readonly post: {
    readonly title: string;
    readonly subtitle: string;
  };
  readonly vote: {
    readonly title: string;
    readonly description: string;
  };
  readonly report: {
    readonly title: string;
    readonly description: string;
  };
  readonly yourData: {
    readonly title: string;
    readonly description: string;
  };
}

/**
 * Language codes
 */
export type LanguageCode = 'en' | 'es' | 'fr' | 'de' | 'af' | 'pt' | 'zh' | 'ja' | 'ar' | 'ru' | 'hi' | 'zu';

/**
 * Helper type to get translation value type from key
 */
export type TranslationValue<T extends TranslationKeys> = T extends `${infer Section}.${infer Key}`
  ? Section extends keyof TranslationStructure
    ? Key extends keyof TranslationStructure[Section]
      ? TranslationStructure[Section][Key]
      : never
    : never
  : never;

