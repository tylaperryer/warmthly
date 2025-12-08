/**
 * Security Monitoring and Alerting System
 * Tracks security events and triggers alerts on suspicious patterns
 * Security Enhancement 7: Security Monitoring and Alerting
 */
/**
 * Security event types
 */
export type SecurityEventType = 'rate_limit_exceeded' | 'invalid_token' | 'invalid_csrf_token' | 'invalid_request_signature' | 'suspicious_activity' | 'authentication_failure' | 'authorization_failure' | 'input_validation_failure' | 'xss_attempt' | 'sql_injection_attempt' | 'path_traversal_attempt' | 'command_injection_attempt';
/**
 * Security event severity levels
 */
export declare enum SecurityEventSeverity {
    LOW = "low",
    MEDIUM = "medium",
    HIGH = "high",
    CRITICAL = "critical"
}
/**
 * Security event interface
 */
export interface SecurityEvent {
    readonly type: SecurityEventType;
    readonly severity: SecurityEventSeverity;
    readonly timestamp: number;
    readonly identifier: string;
    readonly endpoint?: string;
    readonly details?: Record<string, unknown>;
    readonly metadata?: Record<string, unknown>;
}
/**
 * Alert threshold configuration
 */
export interface AlertThreshold {
    readonly eventType: SecurityEventType;
    readonly count: number;
    readonly windowMs: number;
    readonly severity: SecurityEventSeverity;
}
/**
 * Log a security event
 *
 * @param event - Security event to log
 */
export declare function logSecurityEvent(event: SecurityEvent): Promise<void>;
/**
 * Get security events for an identifier
 *
 * @param identifier - Client identifier
 * @param eventType - Event type filter (optional)
 * @param windowMs - Time window in milliseconds (default: 1 hour)
 * @returns Array of security events
 */
export declare function getSecurityEvents(identifier: string, eventType?: SecurityEventType, windowMs?: number): Promise<SecurityEvent[]>;
/**
 * Helper function to log common security events
 */
export declare const SecurityLogger: {
    rateLimitExceeded: (identifier: string, endpoint?: string) => Promise<void>;
    invalidToken: (identifier: string, endpoint?: string) => Promise<void>;
    invalidCSRFToken: (identifier: string, endpoint?: string) => Promise<void>;
    invalidRequestSignature: (identifier: string, endpoint?: string) => Promise<void>;
    authenticationFailure: (identifier: string, endpoint?: string) => Promise<void>;
    xssAttempt: (identifier: string, endpoint?: string, details?: Record<string, unknown>) => Promise<void>;
    sqlInjectionAttempt: (identifier: string, endpoint?: string, details?: Record<string, unknown>) => Promise<void>;
};
//# sourceMappingURL=security-monitor.d.ts.map