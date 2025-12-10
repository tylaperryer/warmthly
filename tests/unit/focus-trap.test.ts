import { trapFocus } from '@utils/focus-trap.js';
import { describe, it, expect, beforeEach } from 'vitest';

describe('Focus Trap', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('should return no-op cleanup for null element', () => {
    const cleanup = trapFocus(null);
    expect(typeof cleanup).toBe('function');
    (expect(() => cleanup()) as any).not.toThrow();
  });

  it('should trap focus within element', () => {
    const container = document.createElement('div');
    const button1 = document.createElement('button');
    button1.textContent = 'Button 1';
    const button2 = document.createElement('button');
    button2.textContent = 'Button 2';
    container.appendChild(button1);
    container.appendChild(button2);
    document.body.appendChild(container);

    const cleanup = trapFocus(container);

    // Focus first button
    button1.focus();
    expect(document.activeElement).toBe(button1);

    // Tab should cycle to second button
    const tabEvent = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true });
    container.dispatchEvent(tabEvent);
    expect(document.activeElement).toBe(button2);

    cleanup();
  });

  it('should cycle focus forward with Tab', () => {
    const container = document.createElement('div');
    const buttons = [1, 2, 3].map(() => {
      const btn = document.createElement('button');
      container.appendChild(btn);
      return btn;
    });
    document.body.appendChild(container);

    trapFocus(container);
    buttons[0]!.focus();

    // Tab from last to first
    buttons[2]!.focus();
    const tabEvent = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true });
    container.dispatchEvent(tabEvent);

    expect(document.activeElement).toBe(buttons[0]);
  });

  it('should cycle focus backward with Shift+Tab', () => {
    const container = document.createElement('div');
    const buttons = [1, 2, 3].map(() => {
      const btn = document.createElement('button');
      container.appendChild(btn);
      return btn;
    });
    document.body.appendChild(container);

    trapFocus(container);
    buttons[0]!.focus();

    // Shift+Tab from first to last
    const shiftTabEvent = new KeyboardEvent('keydown', {
      key: 'Tab',
      shiftKey: true,
      bubbles: true,
    });
    container.dispatchEvent(shiftTabEvent);

    expect(document.activeElement).toBe(buttons[2]);
  });

  it('should ignore non-Tab keys', () => {
    const container = document.createElement('div');
    const button = document.createElement('button');
    container.appendChild(button);
    document.body.appendChild(container);

    trapFocus(container);
    button.focus();

    const enterEvent = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true });
    container.dispatchEvent(enterEvent);

    // Focus should not change
    expect(document.activeElement).toBe(button);
  });

  it('should cleanup event listener', () => {
    const container = document.createElement('div');
    const button = document.createElement('button');
    container.appendChild(button);
    document.body.appendChild(container);

    const cleanup = trapFocus(container);
    cleanup();

    // After cleanup, Tab should work normally
    const tabEvent = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true });
    container.dispatchEvent(tabEvent);
    // Should not prevent default after cleanup
    expect(tabEvent.defaultPrevented).toBe(false);
  });

  it('should handle empty container gracefully', () => {
    const container = document.createElement('div');
    document.body.appendChild(container);

    trapFocus(container);

    const tabEvent = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true });
    container.dispatchEvent(tabEvent);

    expect(tabEvent.defaultPrevented).toBe(true);
  });
});
