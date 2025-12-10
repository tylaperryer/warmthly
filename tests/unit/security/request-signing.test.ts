/**
 * Request Signing Tests
 * Tests for HMAC-based request signing and verification
 * Phase 5 Issue 5.3: Missing Tests for Critical Security Features
 */

import { describe, it, expect } from 'vitest';

import {
  signRequest,
  verifyRequest,
  extractSignature,
} from '../../../api/security/request-signing.js';

describe('Request Signing', () => {
  const secret = 'test-secret-key-12345';
  const payload = { amount: 10000, currency: 'ZAR' };

  describe('signRequest', () => {
    it('should sign a JSON payload', () => {
      const signature = signRequest(payload, secret);
      (expect(signature) as any).toBeDefined();
      expect(typeof signature).toBe('string');
      expect(signature.length).toBe(64); // SHA256 hex = 64 characters
    });

    it('should sign a string payload', () => {
      const stringPayload = JSON.stringify(payload);
      const signature = signRequest(stringPayload, secret);
      (expect(signature) as any).toBeDefined();
      expect(typeof signature).toBe('string');
    });

    it('should produce consistent signatures for same payload and secret', () => {
      const sig1 = signRequest(payload, secret);
      const sig2 = signRequest(payload, secret);
      expect(sig1).toBe(sig2);
    });

    it('should produce different signatures for different secrets', () => {
      const sig1 = signRequest(payload, secret);
      const sig2 = signRequest(payload, 'different-secret');
      (expect(sig1) as any).not.toBe(sig2);
    });

    it('should produce different signatures for different payloads', () => {
      const payload2 = { amount: 20000, currency: 'ZAR' };
      const sig1 = signRequest(payload, secret);
      const sig2 = signRequest(payload2, secret);
      (expect(sig1) as any).not.toBe(sig2);
    });
  });

  describe('verifyRequest', () => {
    it('should verify a valid signature', () => {
      const signature = signRequest(payload, secret);
      const isValid = verifyRequest(payload, signature, secret);
      expect(isValid).toBe(true);
    });

    it('should reject an invalid signature', () => {
      const isValid = verifyRequest(payload, 'invalid-signature', secret);
      expect(isValid).toBe(false);
    });

    it('should reject signature for modified payload', () => {
      const signature = signRequest(payload, secret);
      const modifiedPayload = { amount: 20000, currency: 'ZAR' };
      const isValid = verifyRequest(modifiedPayload, signature, secret);
      expect(isValid).toBe(false);
    });

    it('should reject signature with wrong secret', () => {
      const signature = signRequest(payload, secret);
      const isValid = verifyRequest(payload, signature, 'wrong-secret');
      expect(isValid).toBe(false);
    });

    it('should reject null signature', () => {
      const isValid = verifyRequest(payload, null, secret);
      expect(isValid).toBe(false);
    });

    it('should reject undefined signature', () => {
      const isValid = verifyRequest(payload, undefined, secret);
      expect(isValid).toBe(false);
    });

    it('should use constant-time comparison (timing attack prevention)', () => {
      const validSignature = signRequest(payload, secret);
      const invalidSignature = 'a'.repeat(64); // Invalid but same length

      const startValid = performance.now();
      verifyRequest(payload, validSignature, secret);
      const timeValid = performance.now() - startValid;

      const startInvalid = performance.now();
      verifyRequest(payload, invalidSignature, secret);
      const timeInvalid = performance.now() - startInvalid;

      // Times should be similar (within 10ms) for constant-time comparison
      const timeDiff = Math.abs(timeValid - timeInvalid);
      (expect(timeDiff) as any).toBeLessThan(10);
    });

    it('should handle string payloads', () => {
      const stringPayload = JSON.stringify(payload);
      const signature = signRequest(stringPayload, secret);
      const isValid = verifyRequest(stringPayload, signature, secret);
      expect(isValid).toBe(true);
    });
  });

  describe('extractSignature', () => {
    it('should extract signature from headers', () => {
      const headers = {
        'x-request-signature': 'test-signature',
      };
      const signature = extractSignature(headers);
      expect(signature).toBe('test-signature');
    });

    it('should return null if signature header is missing', () => {
      const headers = {};
      const signature = extractSignature(headers);
      (expect(signature) as any).toBeNull();
    });

    it('should handle case-insensitive header names', () => {
      const headers = {
        'X-Request-Signature': 'test-signature',
      };
      const signature = extractSignature(headers);
      expect(signature).toBe('test-signature');
    });
  });
});
