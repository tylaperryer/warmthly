import {
  lockBodyScroll,
  forceUnlockScroll,
  cleanupYocoState,
  initYocoStyleObserver,
} from '@utils/scroll-lock.js';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('Scroll Lock', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    document.body.style.cssText = '';
    document.documentElement.style.cssText = '';
    document.body.className = '';
    document.documentElement.className = '';
    window.scrollTo(0, 0);
    (vi as any).clearAllTimers();
    (vi as any).useFakeTimers();
  });

  afterEach(() => {
    (vi as any).useRealTimers();
  });

  it('should lock body scroll and save position', () => {
    window.scrollTo(0, 100);
    const savedPosition = lockBodyScroll();

    (expect(savedPosition) as any).toBeGreaterThanOrEqual(0);
    expect(document.body.classList.contains('modal-open')).toBe(true);
    expect(document.body.style.position).toBe('fixed');
    expect(document.body.style.overflow).toBe('hidden');
  });

  it('should unlock scroll and restore position', () => {
    window.scrollTo(0, 100);
    lockBodyScroll();

    forceUnlockScroll();
    (vi as any).advanceTimersByTime(400);

    expect(document.body.classList.contains('modal-open')).toBe(false);
    expect(document.body.style.position).toBe('');
  });

  it('should remove Yoco styles', () => {
    const yocoStyle = document.createElement('style');
    yocoStyle.id = 'yc-injected-styles';
    document.head.appendChild(yocoStyle);

    forceUnlockScroll();
    (vi as any).advanceTimersByTime(400);

    (expect(document.getElementById('yc-injected-styles')) as any).toBeNull();
  });

  it('should cleanup Yoco state', () => {
    const button = document.createElement('button');
    button.id = 'donateButton';
    button.style.display = 'none';
    document.body.appendChild(button);

    const embed = document.createElement('div');
    embed.id = 'yocoPaymentEmbed';
    embed.style.display = 'block';
    document.body.appendChild(embed);

    cleanupYocoState();
    (vi as any).advanceTimersByTime(400);

    expect(button.style.display).toBe('inline-block');
    expect(embed.style.display).toBe('none');
  });

  it('should initialize Yoco style observer', () => {
    initYocoStyleObserver();

    // Add Yoco style
    const yocoStyle = document.createElement('style');
    yocoStyle.id = 'yc-injected-styles';
    document.head.appendChild(yocoStyle);

    (vi as any).advanceTimersByTime(100);

    // Style should be removed
    (expect(document.getElementById('yc-injected-styles')) as any).toBeNull();
  });

  it('should handle errors gracefully', () => {
    (globalThis as any).document = undefined;

    (expect(() => lockBodyScroll()) as any).not.toThrow();
    (expect(() => forceUnlockScroll()) as any).not.toThrow();
    (expect(() => cleanupYocoState()) as any).not.toThrow();
    (expect(() => initYocoStyleObserver()) as any).not.toThrow();

    (globalThis as any).document = window.document;
  });
});
