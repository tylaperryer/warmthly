/**
 * Security Monitoring and Alerting System
 * Tracks security events and triggers alerts on suspicious patterns
 * Security Enhancement 7: Security Monitoring and Alerting
 */
import logger from '../utils/logger.js';
import { getRedisClient } from '../utils/redis-client.js';
/**
 * Security event severity levels
 */
export var SecurityEventSeverity;
(function (SecurityEventSeverity) {
    SecurityEventSeverity["LOW"] = "low";
    SecurityEventSeverity["MEDIUM"] = "medium";
    SecurityEventSeverity["HIGH"] = "high";
    SecurityEventSeverity["CRITICAL"] = "critical";
})(SecurityEventSeverity || (SecurityEventSeverity = {}));
/**
 * Default alert thresholds
 */
const DEFAULT_ALERT_THRESHOLDS = [
    {
        eventType: 'rate_limit_exceeded',
        count: 10,
        windowMs: 15 * 60 * 1000, // 15 minutes
        severity: SecurityEventSeverity.MEDIUM,
    },
    {
        eventType: 'invalid_token',
        count: 5,
        windowMs: 5 * 60 * 1000, // 5 minutes
        severity: SecurityEventSeverity.HIGH,
    },
    {
        eventType: 'authentication_failure',
        count: 10,
        windowMs: 15 * 60 * 1000, // 15 minutes
        severity: SecurityEventSeverity.HIGH,
    },
    {
        eventType: 'xss_attempt',
        count: 1,
        windowMs: 60 * 60 * 1000, // 1 hour
        severity: SecurityEventSeverity.CRITICAL,
    },
    {
        eventType: 'sql_injection_attempt',
        count: 1,
        windowMs: 60 * 60 * 1000, // 1 hour
        severity: SecurityEventSeverity.CRITICAL,
    },
];
/**
 * Log a security event
 *
 * @param event - Security event to log
 */
export async function logSecurityEvent(event) {
    try {
        // Log to console (structured logging)
        logger.error(`[SecurityEvent] ${event.type}`, {
            severity: event.severity,
            identifier: event.identifier,
            endpoint: event.endpoint,
            details: event.details,
            metadata: event.metadata,
            timestamp: new Date(event.timestamp).toISOString(),
        });
        // Store in Redis for pattern detection
        const client = await getRedisClient();
        const key = `security:events:${event.identifier}:${event.type}`;
        const now = Date.now();
        // Add event to sorted set (score = timestamp)
        await client.zAdd(key, {
            score: now,
            value: JSON.stringify(event),
        });
        // Set expiration (keep events for 24 hours)
        await client.pexpire(key, 24 * 60 * 60 * 1000);
        // Check if alert threshold is exceeded
        await checkAlertThresholds(event);
        // Detect anomalies - non-blocking
        try {
            const { detectAnomalies } = await import('./anomaly-detection.js');
            await detectAnomalies(event);
        }
        catch (anomalyError) {
            // Don't log - anomaly detection handles its own errors
        }
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        logger.error('[security-monitor] Error logging security event:', errorMessage);
        // Don't throw - logging failures shouldn't break the application
    }
}
/**
 * Check if alert thresholds are exceeded
 *
 * @param event - Security event that was just logged
 */
async function checkAlertThresholds(event) {
    try {
        const threshold = DEFAULT_ALERT_THRESHOLDS.find(t => t.eventType === event.type);
        if (!threshold) {
            return; // No threshold configured for this event type
        }
        const client = await getRedisClient();
        const key = `security:events:${event.identifier}:${event.type}`;
        const now = Date.now();
        const windowStart = now - threshold.windowMs;
        // Count events in the time window
        const count = await client.zCount(key, windowStart, now);
        if (count >= threshold.count) {
            // Threshold exceeded - trigger alert
            await triggerAlert({
                type: event.type,
                severity: threshold.severity,
                identifier: event.identifier,
                count,
                windowMs: threshold.windowMs,
                threshold: threshold.count,
            });
        }
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        logger.error('[security-monitor] Error checking alert thresholds:', errorMessage);
    }
}
/**
 * Trigger a security alert
 *
 * @param alert - Alert to trigger
 */
async function triggerAlert(alert) {
    const alertMessage = `[SECURITY ALERT] ${alert.type} threshold exceeded: ${alert.count} events in ${alert.windowMs / 1000}s from ${alert.identifier}`;
    // Log critical alert
    logger.error(alertMessage, {
        severity: alert.severity,
        identifier: alert.identifier,
        count: alert.count,
        threshold: alert.threshold,
        timestamp: new Date(alert.timestamp).toISOString(),
    });
    // Store alert in Redis for monitoring dashboard
    try {
        const client = await getRedisClient();
        const alertKey = `security:alerts:${alert.identifier}`;
        await client.zAdd(alertKey, {
            score: alert.timestamp,
            value: JSON.stringify(alert),
        });
        await client.pexpire(alertKey, 7 * 24 * 60 * 60 * 1000); // Keep for 7 days
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        logger.error('[security-monitor] Error storing alert:', errorMessage);
    }
    // TODO: Integrate with external alerting services:
    // - Email notifications
    // - Slack/Discord webhooks
    // - PagerDuty
    // - Security Information and Event Management (SIEM) systems
}
/**
 * Get security events for an identifier
 *
 * @param identifier - Client identifier
 * @param eventType - Event type filter (optional)
 * @param windowMs - Time window in milliseconds (default: 1 hour)
 * @returns Array of security events
 */
export async function getSecurityEvents(identifier, eventType, windowMs = 3600000) {
    try {
        const client = await getRedisClient();
        const now = Date.now();
        const windowStart = now - windowMs;
        if (eventType) {
            const key = `security:events:${identifier}:${eventType}`;
            const events = await client.zRangeByScore(key, windowStart, now);
            return events.map(event => JSON.parse(event));
        }
        // Get all event types for this identifier
        const pattern = `security:events:${identifier}:*`;
        const keys = await client.keys(pattern);
        const allEvents = [];
        for (const key of keys) {
            const events = await client.zRangeByScore(key, windowStart, now);
            allEvents.push(...events.map(event => JSON.parse(event)));
        }
        return allEvents.sort((a, b) => b.timestamp - a.timestamp);
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        logger.error('[security-monitor] Error getting security events:', errorMessage);
        return [];
    }
}
/**
 * Helper function to log common security events
 */
export const SecurityLogger = {
    rateLimitExceeded: (identifier, endpoint) => logSecurityEvent({
        type: 'rate_limit_exceeded',
        severity: SecurityEventSeverity.MEDIUM,
        timestamp: Date.now(),
        identifier,
        endpoint,
    }),
    invalidToken: (identifier, endpoint) => logSecurityEvent({
        type: 'invalid_token',
        severity: SecurityEventSeverity.HIGH,
        timestamp: Date.now(),
        identifier,
        endpoint,
    }),
    invalidCSRFToken: (identifier, endpoint) => logSecurityEvent({
        type: 'invalid_csrf_token',
        severity: SecurityEventSeverity.HIGH,
        timestamp: Date.now(),
        identifier,
        endpoint,
    }),
    invalidRequestSignature: (identifier, endpoint) => logSecurityEvent({
        type: 'invalid_request_signature',
        severity: SecurityEventSeverity.HIGH,
        timestamp: Date.now(),
        identifier,
        endpoint,
    }),
    authenticationFailure: (identifier, endpoint) => logSecurityEvent({
        type: 'authentication_failure',
        severity: SecurityEventSeverity.MEDIUM,
        timestamp: Date.now(),
        identifier,
        endpoint,
    }),
    xssAttempt: (identifier, endpoint, details) => logSecurityEvent({
        type: 'xss_attempt',
        severity: SecurityEventSeverity.CRITICAL,
        timestamp: Date.now(),
        identifier,
        endpoint,
        details,
    }),
    sqlInjectionAttempt: (identifier, endpoint, details) => logSecurityEvent({
        type: 'sql_injection_attempt',
        severity: SecurityEventSeverity.CRITICAL,
        timestamp: Date.now(),
        identifier,
        endpoint,
        details,
    }),
};
//# sourceMappingURL=security-monitor.js.map