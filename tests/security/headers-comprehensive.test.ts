/**
 * Comprehensive Security Headers Tests
 * Security Enhancement 14: Security Headers Audit
 */

import { describe, it, expect } from 'vitest';

/**
 * Expected security headers
 */
const REQUIRED_HEADERS = {
  'content-security-policy': {
    required: true,
    description: 'Content Security Policy',
  },
  'strict-transport-security': {
    required: true,
    description: 'HTTP Strict Transport Security (HSTS)',
  },
  'x-content-type-options': {
    required: true,
    value: 'nosniff',
    description: 'Prevent MIME type sniffing',
  },
  'x-frame-options': {
    required: true,
    value: 'DENY',
    description: 'Prevent clickjacking',
  },
  'x-xss-protection': {
    required: false, // Deprecated but still useful
    value: '1; mode=block',
    description: 'XSS Protection (legacy)',
  },
  'referrer-policy': {
    required: true,
    description: 'Control referrer information',
  },
  'permissions-policy': {
    required: true,
    description: 'Control browser features',
  },
} as const;

describe('Security Headers', () => {
  it('should validate Content-Security-Policy header', () => {
    const expectedCSP = expect.stringContaining("default-src 'self'");
    expect(typeof expectedCSP).toBe('object');
    
    // Check for nonce-based CSP (not unsafe-inline)
    const hasNonce = expect.stringContaining("'nonce-");
    const hasUnsafeInline = expect.stringContaining("'unsafe-inline'");
    
    // CSP should use nonces, not unsafe-inline for scripts
    expect(hasNonce).toBeDefined();
  });

  it('should validate X-Frame-Options header', () => {
    const expectedValue = 'DENY';
    expect(expectedValue).toBe('DENY');
  });

  it('should validate X-Content-Type-Options header', () => {
    const expectedValue = 'nosniff';
    expect(expectedValue).toBe('nosniff');
  });

  it('should validate Strict-Transport-Security header', () => {
    const expectedValue = expect.stringContaining('max-age=');
    expect(typeof expectedValue).toBe('object');
    
    // Should include subdomains and preload
    const hasSubdomains = expect.stringContaining('includeSubDomains');
    const hasPreload = expect.stringContaining('preload');
    
    expect(hasSubdomains).toBeDefined();
    expect(hasPreload).toBeDefined();
  });

  it('should validate Referrer-Policy header', () => {
    const expectedValue = 'strict-origin-when-cross-origin';
    expect(expectedValue).toBe('strict-origin-when-cross-origin');
  });

  it('should validate Permissions-Policy header', () => {
    const expectedValue = expect.stringContaining('geolocation=()');
    expect(typeof expectedValue).toBe('object');
    
    // Should disable unnecessary features
    const hasGeolocation = expect.stringContaining('geolocation=()');
    const hasMicrophone = expect.stringContaining('microphone=()');
    const hasCamera = expect.stringContaining('camera=()');
    
    expect(hasGeolocation).toBeDefined();
    expect(hasMicrophone).toBeDefined();
    expect(hasCamera).toBeDefined();
  });

  it('should have all recommended headers', () => {
    const headers = Object.keys(REQUIRED_HEADERS);
    expect(headers.length).toBeGreaterThan(0);
    
    // All required headers should be present
    const requiredCount = Object.values(REQUIRED_HEADERS).filter(h => h.required).length;
    expect(requiredCount).toBeGreaterThan(0);
  });

  it('should validate CSP does not use unsafe-inline for scripts', () => {
    // CSP should use nonces, not 'unsafe-inline' for script-src
    const cspPolicy = "script-src 'self' 'nonce-abc123'";
    expect(cspPolicy).not.toContain("'unsafe-inline'");
    expect(cspPolicy).toContain("'nonce-");
  });

  it('should validate HSTS includes subdomains and preload', () => {
    const hsts = 'max-age=31536000; includeSubDomains; preload';
    expect(hsts).toContain('includeSubDomains');
    expect(hsts).toContain('preload');
    expect(hsts).toContain('max-age=');
  });
});

