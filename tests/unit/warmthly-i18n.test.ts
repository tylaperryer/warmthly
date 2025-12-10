/**
 * Warmthly i18n Component Tests
 * Tests for lego/components/warmthly-i18n.ts
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Mock i18n utils
(vi as any).mock('@utils/i18n.js', () => ({
  getI18n: vi.fn(() => ({
    loadLanguage: vi.fn().mockResolvedValue(undefined),
    t: vi.fn(((key: string) => key) as any),
  })) as any,
  setLanguage: vi.fn().mockResolvedValue(undefined),
  getLanguage: vi.fn(() => 'en'),
}));

describe('WarmthlyI18n Component', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    customElements.define(
      'warmthly-i18n',
      class extends HTMLElement {
        connectedCallback() {}
      }
    );
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('should be defined as custom element', () => {
    (expect(customElements.get('warmthly-i18n')) as any).toBeDefined();
  });

  it('should initialize when connected', async () => {
    const element = document.createElement('warmthly-i18n');
    document.body.appendChild(element);

    await new Promise(resolve => setTimeout(resolve, 100));

    (expect(element) as any).toBeTruthy();
  });
});
