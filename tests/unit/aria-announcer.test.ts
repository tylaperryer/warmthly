/**
 * ARIA Announcer Tests
 * Tests for lego/utils/aria-announcer.ts
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ariaAnnouncer } from '@utils/aria-announcer.js';

describe('ARIA Announcer', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('should create announcer element', () => {
    ariaAnnouncer.announce('Test message');

    const announcer = document.getElementById('aria-announcer');
    expect(announcer).toBeTruthy();
    expect(announcer?.getAttribute('role')).toBe('status');
    expect(announcer?.getAttribute('aria-live')).toBe('polite');
  });

  it('should announce message', () => {
    ariaAnnouncer.announce('Test announcement');

    const announcer = document.getElementById('aria-announcer');
    expect(announcer?.textContent).toBe('Test announcement');
  });

  it('should support assertive priority', () => {
    ariaAnnouncer.announce('Urgent message', 'assertive');

    const announcer = document.getElementById('aria-announcer');
    expect(announcer?.getAttribute('aria-live')).toBe('assertive');
  });

  it('should ignore empty messages', () => {
    ariaAnnouncer.announce('');

    const announcer = document.getElementById('aria-announcer');
    expect(announcer).toBeFalsy();
  });

  it('should clear message after timeout', async () => {
    vi.useFakeTimers();
    ariaAnnouncer.announce('Test message');

    const announcer = document.getElementById('aria-announcer');
    expect(announcer?.textContent).toBe('Test message');

    vi.advanceTimersByTime(1000);

    expect(announcer?.textContent).toBe('');
    vi.useRealTimers();
  });
});

