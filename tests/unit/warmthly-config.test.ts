import { WARMTHLY_CONFIG, getAppUrl, getPath, getNavigation } from '@config/warmthly-config.js';
import { describe, it, expect } from 'vitest';
// Note: Import from .js even though source is .ts - this is how TypeScript/ES modules work

describe('Warmthly Config', () => {
  it('should export WARMTHLY_CONFIG', () => {
    (expect(WARMTHLY_CONFIG) as any).toBeDefined();
    (expect(WARMTHLY_CONFIG.urls) as any).toBeDefined();
    expect(WARMTHLY_CONFIG.urls.main).toBe('https://www.warmthly.org');
  });

  it('should get app URL correctly', () => {
    expect(getAppUrl('main')).toBe('https://www.warmthly.org');
    expect(getAppUrl('mint')).toBe('https://mint.warmthly.org');
    expect(getAppUrl('post')).toBe('https://post.warmthly.org');
    expect(getAppUrl('admin')).toBe('https://admin.warmthly.org');
    expect(getAppUrl('unknown' as any)).toBe('https://www.warmthly.org');
  });

  it('should get path correctly', () => {
    expect(getPath('lego')).toBe('/lego');
    expect(getPath('styles')).toBe('/lego/styles');
    expect(getPath('unknown' as any)).toBe('');
  });

  it('should get navigation for app', () => {
    const mainNav = getNavigation('main');
    (expect(mainNav) as any).toBeDefined();
    expect(Array.isArray(mainNav)).toBe(true);

    const mintNav = getNavigation('mint');
    (expect(mintNav) as any).toBeDefined();
    (expect(mintNav.length) as any).toBeGreaterThan(0);
  });
});
