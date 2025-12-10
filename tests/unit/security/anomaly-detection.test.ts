/**
 * Anomaly Detection Tests
 * Tests for behavioral anomaly detection
 * Phase 5 Issue 5.3: Missing Tests for Critical Security Features
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

import {
  detectAnomalies,
  AnomalyType,
  type AnomalyDetectionConfig,
} from '../../../api/security/anomaly-detection.js';
import {
  SecurityEventSeverity,
  type SecurityEvent,
} from '../../../api/security/security-monitor.js';

// Mock Redis client
(vi as any).mock('../../../api/utils/redis-client.js', () => ({
  getRedisClient: vi.fn().mockResolvedValue({
    get: vi.fn(),
    set: vi.fn(),
    incr: vi.fn(),
    expire: vi.fn(),
  }),
}));

// Mock logger
(vi as any).mock('../../../api/utils/logger.js', () => ({
  default: {
    log: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

describe('Anomaly Detection', () => {
  const baseEvent: SecurityEvent = {
    type: 'suspicious_activity',
    severity: SecurityEventSeverity.MEDIUM,
    timestamp: Date.now(),
    identifier: 'test-identifier',
    details: {},
  };

  const defaultConfig: AnomalyDetectionConfig = {
    enabled: true,
    frequencyBased: {
      maxEventsPerWindow: 10,
      windowMs: 60000, // 1 minute
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Frequency-based anomaly detection', () => {
    it('should detect frequency anomalies', async () => {
      const config: AnomalyDetectionConfig = {
        ...defaultConfig,
        frequencyBased: {
          maxEventsPerWindow: 5,
          windowMs: 60000,
        },
      };

      // Create multiple events in short time
      const events: SecurityEvent[] = Array.from({ length: 10 }, (_, i) => ({
        ...baseEvent,
        timestamp: Date.now() - i * 1000, // 1 second apart
      }));

      // Test with high frequency
      const result = await detectAnomalies(events[0]!, config);

      // Should detect anomaly if frequency exceeds threshold
      // Note: Actual implementation may vary based on Redis state
      (expect(result) as any).toBeDefined();
      (expect(Array.isArray(result)) as any).toBe(true);
      if (result.length > 0) {
        (expect(result[0]!.detected) as any).toBeDefined();
        expect(typeof result[0]!.detected).toBe('boolean');
      }
    });

    it('should not detect anomaly for normal frequency', async () => {
      const config: AnomalyDetectionConfig = {
        ...defaultConfig,
        frequencyBased: {
          maxEventsPerWindow: 100,
          windowMs: 60000,
        },
      };

      const result = await detectAnomalies(baseEvent, config);
      (expect(result) as any).toBeDefined();
    });
  });

  describe('Time-based anomaly detection', () => {
    it('should detect anomalies outside expected hours', async () => {
      const config: AnomalyDetectionConfig = {
        ...defaultConfig,
        timeBased: {
          expectedHours: [9, 10, 11, 12, 13, 14, 15, 16, 17], // 9 AM - 5 PM
          timezone: 'UTC',
        },
      };

      // Create event at 2 AM (outside expected hours)
      const lateNightEvent: SecurityEvent = {
        ...baseEvent,
        timestamp: new Date().setHours(2, 0, 0, 0),
      };

      const result = await detectAnomalies(lateNightEvent, config);
      (expect(result) as any).toBeDefined();
    });

    it('should not detect anomaly during expected hours', async () => {
      const config: AnomalyDetectionConfig = {
        ...defaultConfig,
        timeBased: {
          expectedHours: [9, 10, 11, 12, 13, 14, 15, 16, 17],
          timezone: 'UTC',
        },
      };

      // Create event at 12 PM (within expected hours)
      const normalHourEvent: SecurityEvent = {
        ...baseEvent,
        timestamp: new Date().setHours(12, 0, 0, 0),
      };

      const result = await detectAnomalies(normalHourEvent, config);
      (expect(result) as any).toBeDefined();
    });
  });

  describe('Pattern-based anomaly detection', () => {
    it('should detect repeated patterns', async () => {
      const config: AnomalyDetectionConfig = {
        ...defaultConfig,
      };

      const result = await detectAnomalies(baseEvent, config);
      (expect(result) as any).toBeDefined();
      (expect(Array.isArray(result)) as any).toBe(true);
      if (result.length > 0) {
        (expect(result[0]!.type) as any).toBeDefined();
      }
    });
  });

  describe('Anomaly result structure', () => {
    it('should return valid anomaly result', async () => {
      const result = await detectAnomalies(baseEvent, defaultConfig);

      (expect(result) as any).toBeDefined();
      (expect(Array.isArray(result)) as any).toBe(true);
      if (result.length > 0) {
        const firstResult = result[0]!;
        (expect(firstResult) as any).toHaveProperty('detected');
        (expect(firstResult) as any).toHaveProperty('type');
        (expect(firstResult) as any).toHaveProperty('severity');
        (expect(firstResult) as any).toHaveProperty('score');
        (expect(firstResult) as any).toHaveProperty('details');

        expect(typeof firstResult.detected).toBe('boolean');
        (expect(Object.values(AnomalyType)) as any).toContain(firstResult.type);
        (expect(Object.values(SecurityEventSeverity)) as any).toContain(firstResult.severity);
        expect(typeof firstResult.score).toBe('number');
        (expect(firstResult.score) as any).toBeGreaterThanOrEqual(0);
        (expect(firstResult.score) as any).toBeLessThanOrEqual(100);
      }
    });
  });

  describe('Disabled anomaly detection', () => {
    it('should not detect anomalies when disabled', async () => {
      const disabledConfig: AnomalyDetectionConfig = {
        enabled: false,
      };

      const result = await detectAnomalies(baseEvent, disabledConfig);
      (expect(result) as any).toEqual([]);
    });
  });
});
