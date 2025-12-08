import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  lockBodyScroll,
  forceUnlockScroll,
  cleanupYocoState,
  initYocoStyleObserver,
} from '@utils/scroll-lock.js';

describe('Scroll Lock', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    document.body.style.cssText = '';
    document.documentElement.style.cssText = '';
    document.body.className = '';
    document.documentElement.className = '';
    window.scrollTo(0, 0);
    vi.clearAllTimers();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should lock body scroll and save position', () => {
    window.scrollTo(0, 100);
    const savedPosition = lockBodyScroll();

    expect(savedPosition).toBeGreaterThanOrEqual(0);
    expect(document.body.classList.contains('modal-open')).toBe(true);
    expect(document.body.style.position).toBe('fixed');
    expect(document.body.style.overflow).toBe('hidden');
  });

  it('should unlock scroll and restore position', () => {
    window.scrollTo(0, 100);
    lockBodyScroll();

    forceUnlockScroll();
    vi.advanceTimersByTime(400);

    expect(document.body.classList.contains('modal-open')).toBe(false);
    expect(document.body.style.position).toBe('');
  });

  it('should remove Yoco styles', () => {
    const yocoStyle = document.createElement('style');
    yocoStyle.id = 'yc-injected-styles';
    document.head.appendChild(yocoStyle);

    forceUnlockScroll();
    vi.advanceTimersByTime(400);

    expect(document.getElementById('yc-injected-styles')).toBeNull();
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
    vi.advanceTimersByTime(400);

    expect(button.style.display).toBe('inline-block');
    expect(embed.style.display).toBe('none');
  });

  it('should initialize Yoco style observer', () => {
    initYocoStyleObserver();

    // Add Yoco style
    const yocoStyle = document.createElement('style');
    yocoStyle.id = 'yc-injected-styles';
    document.head.appendChild(yocoStyle);

    vi.advanceTimersByTime(100);

    // Style should be removed
    expect(document.getElementById('yc-injected-styles')).toBeNull();
  });

  it('should handle errors gracefully', () => {
    // @ts-expect-error - Testing error handling
    (globalThis as any).document = undefined;

    expect(() => lockBodyScroll()).not.toThrow();
    expect(() => forceUnlockScroll()).not.toThrow();
    expect(() => cleanupYocoState()).not.toThrow();
    expect(() => initYocoStyleObserver()).not.toThrow();

    // @ts-expect-error - Restore
    (globalThis as any).document = window.document;
  });
});
