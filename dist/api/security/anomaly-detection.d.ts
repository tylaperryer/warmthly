/**
 * Behavioral Anomaly Detection (BAD)
 * Detects suspicious patterns in security events
 * Open-source anomaly detection for security monitoring
 */
import { SecurityEventSeverity } from './security-monitor.js';
import type { SecurityEvent } from './security-monitor.js';
/**
 * Anomaly type
 */
export declare enum AnomalyType {
    TIME_BASED = "time_based",
    LOCATION_BASED = "location_based",
    FREQUENCY_BASED = "frequency_based",
    PATTERN_BASED = "pattern_based"
}
/**
 * Anomaly detection result
 */
export interface AnomalyResult {
    readonly detected: boolean;
    readonly type: AnomalyType;
    readonly severity: SecurityEventSeverity;
    readonly score: number;
    readonly details: Record<string, unknown>;
    readonly recommendation?: string;
}
/**
 * Time-based anomaly detection configuration
 */
interface TimeBasedConfig {
    readonly expectedHours: readonly number[];
    readonly timezone?: string;
}
/**
 * Location-based anomaly detection configuration
 */
interface LocationBasedConfig {
    readonly maxmindDbPath?: string;
    readonly allowedCountries?: readonly string[];
    readonly alertOnNewCountry: boolean;
    readonly alertOnNewCity: boolean;
}
/**
 * Frequency-based anomaly detection configuration
 */
interface FrequencyBasedConfig {
    readonly maxEventsPerWindow: number;
    readonly windowMs: number;
    readonly thresholdMultiplier?: number;
}
/**
 * Anomaly detection configuration
 */
export interface AnomalyDetectionConfig {
    readonly timeBased?: TimeBasedConfig;
    readonly locationBased?: LocationBasedConfig;
    readonly frequencyBased?: FrequencyBasedConfig;
    readonly enabled: boolean;
}
/**
 * Detect anomalies in security event
 */
export declare function detectAnomalies(event: SecurityEvent, config?: AnomalyDetectionConfig): Promise<AnomalyResult[]>;
/**
 * Initialize anomaly detection
 */
export declare function initializeAnomalyDetection(config?: AnomalyDetectionConfig): Promise<void>;
export {};
//# sourceMappingURL=anomaly-detection.d.ts.map