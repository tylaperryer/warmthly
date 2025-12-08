/**
 * Behavioral Anomaly Detection (BAD)
 * Detects suspicious patterns in security events
 * Open-source anomaly detection for security monitoring
 */

import logger from '../utils/logger.js';
import { getRedisClient } from '../utils/redis-client.js';

import { logSecurityEvent, SecurityEventSeverity } from './security-monitor.js';
import type { SecurityEvent } from './security-monitor.js';

/**
 * Anomaly type
 */
export enum AnomalyType {
  TIME_BASED = 'time_based',
  LOCATION_BASED = 'location_based',
  FREQUENCY_BASED = 'frequency_based',
  PATTERN_BASED = 'pattern_based',
}

/**
 * Anomaly detection result
 */
export interface AnomalyResult {
  readonly detected: boolean;
  readonly type: AnomalyType;
  readonly severity: SecurityEventSeverity;
  readonly score: number; // 0-100, higher = more suspicious
  readonly details: Record<string, unknown>;
  readonly recommendation?: string;
}

/**
 * Time-based anomaly detection configuration
 */
interface TimeBasedConfig {
  readonly expectedHours: readonly number[]; // Hours of day (0-23) when activity is expected
  readonly timezone?: string; // Default: UTC
}

/**
 * Location-based anomaly detection configuration
 */
interface LocationBasedConfig {
  readonly maxmindDbPath?: string; // Path to MaxMind GeoIP2 database
  readonly allowedCountries?: readonly string[]; // ISO 3166-1 alpha-2 country codes
  readonly alertOnNewCountry: boolean; // Alert when login from new country
  readonly alertOnNewCity: boolean; // Alert when login from new city
}

/**
 * Frequency-based anomaly detection configuration
 */
interface FrequencyBasedConfig {
  readonly maxEventsPerWindow: number;
  readonly windowMs: number;
  readonly thresholdMultiplier?: number; // Alert if events exceed threshold * average
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
 * Default configuration
 */
const DEFAULT_CONFIG: AnomalyDetectionConfig = {
  enabled: true,
  timeBased: {
    expectedHours: [9, 10, 11, 12, 13, 14, 15, 16, 17], // 9 AM - 5 PM UTC
    timezone: 'UTC',
  },
  locationBased: {
    alertOnNewCountry: true,
    alertOnNewCity: false,
  },
  frequencyBased: {
    maxEventsPerWindow: 10,
    windowMs: 5 * 60 * 1000, // 5 minutes
    thresholdMultiplier: 3,
  },
};

/**
 * GeoIP database (MaxMind GeoLite2)
 * In production, use: npm install maxmind
 */
let geoipDb: any = null;

/**
 * Initialize GeoIP database
 */
async function initializeGeoIP(config: LocationBasedConfig): Promise<void> {
  if (!config.maxmindDbPath) {
    logger.warn(
      '[anomaly-detection] GeoIP database path not configured, location-based detection disabled'
    );
    return;
  }

  try {
    // Dynamic import to avoid requiring maxmind if not used
    const maxmind = await import('maxmind');
    geoipDb = await maxmind.open(config.maxmindDbPath);
    logger.info('[anomaly-detection] GeoIP database initialized');
  } catch (error) {
    logger.error('[anomaly-detection] Failed to initialize GeoIP database:', error);
  }
}

/**
 * Get location from IP address
 */
async function getLocationFromIP(ip: string): Promise<{
  country?: string;
  city?: string;
  latitude?: number;
  longitude?: number;
} | null> {
  if (!geoipDb) {
    return null;
  }

  try {
    const result = geoipDb.get(ip);
    if (!result) {
      return null;
    }

    return {
      country: result.country?.iso_code,
      city: result.city?.names?.en,
      latitude: result.location?.latitude,
      longitude: result.location?.longitude,
    };
  } catch (error) {
    logger.error('[anomaly-detection] Failed to get location from IP:', error);
    return null;
  }
}

/**
 * Detect time-based anomalies
 */
async function detectTimeBasedAnomaly(
  event: SecurityEvent,
  config: TimeBasedConfig
): Promise<AnomalyResult | null> {
  const eventDate = new Date(event.timestamp);
  const hour = eventDate.getUTCHours();

  if (!config.expectedHours.includes(hour)) {
    const score = 70; // Moderate suspicion for off-hours activity

    return {
      detected: true,
      type: AnomalyType.TIME_BASED,
      severity: SecurityEventSeverity.MEDIUM,
      score,
      details: {
        eventHour: hour,
        expectedHours: config.expectedHours,
        eventTime: eventDate.toISOString(),
      },
      recommendation: 'Activity detected outside expected hours. Verify if this is legitimate.',
    };
  }

  return null;
}

/**
 * Detect location-based anomalies
 */
async function detectLocationBasedAnomaly(
  event: SecurityEvent,
  config: LocationBasedConfig
): Promise<AnomalyResult | null> {
  if (!config.alertOnNewCountry && !config.alertOnNewCity) {
    return null;
  }

  const location = await getLocationFromIP(event.identifier);
  if (!location || !location.country) {
    return null; // Can't determine location
  }

  // Check if country is allowed
  if (config.allowedCountries && !config.allowedCountries.includes(location.country)) {
    return {
      detected: true,
      type: AnomalyType.LOCATION_BASED,
      severity: SecurityEventSeverity.HIGH,
      score: 90,
      details: {
        country: location.country,
        city: location.city,
        allowedCountries: config.allowedCountries,
      },
      recommendation: `Activity from restricted country: ${location.country}. Verify if this is legitimate.`,
    };
  }

  // Check if this is a new country/city for this identifier
  const client = await getRedisClient();
  const locationKey = `security:location:${event.identifier}`;
  const storedLocation = await client.get(locationKey);

  if (!storedLocation) {
    // First time seeing this identifier - store location
    await client.set(locationKey, JSON.stringify(location), { EX: 86400 * 30 }); // 30 days
    return null; // Not an anomaly, just first occurrence
  }

  const previousLocation = JSON.parse(storedLocation) as typeof location;

  if (config.alertOnNewCountry && previousLocation.country !== location.country) {
    return {
      detected: true,
      type: AnomalyType.LOCATION_BASED,
      severity: SecurityEventSeverity.HIGH,
      score: 85,
      details: {
        previousCountry: previousLocation.country,
        currentCountry: location.country,
        city: location.city,
      },
      recommendation: `Activity from new country: ${location.country} (previously ${previousLocation.country}). Verify if this is legitimate.`,
    };
  }

  if (
    config.alertOnNewCity &&
    previousLocation.city !== location.city &&
    previousLocation.country === location.country
  ) {
    return {
      detected: true,
      type: AnomalyType.LOCATION_BASED,
      severity: SecurityEventSeverity.MEDIUM,
      score: 60,
      details: {
        previousCity: previousLocation.city,
        currentCity: location.city,
        country: location.country,
      },
      recommendation: `Activity from new city: ${location.city}. Verify if this is legitimate.`,
    };
  }

  return null;
}

/**
 * Detect frequency-based anomalies
 */
async function detectFrequencyBasedAnomaly(
  event: SecurityEvent,
  config: FrequencyBasedConfig
): Promise<AnomalyResult | null> {
  const client = await getRedisClient();
  const now = Date.now();
  const windowStart = now - config.windowMs;

  // Count events in time window
  const key = `security:events:${event.identifier}:${event.type}`;
  const events = await client.zRangeByScore(key, windowStart, now);
  const eventCount = events.length;

  if (eventCount > config.maxEventsPerWindow) {
    const threshold = config.maxEventsPerWindow * (config.thresholdMultiplier ?? 3);
    const score = Math.min(100, 50 + (eventCount - config.maxEventsPerWindow) * 5);

    return {
      detected: true,
      type: AnomalyType.FREQUENCY_BASED,
      severity: eventCount > threshold ? SecurityEventSeverity.HIGH : SecurityEventSeverity.MEDIUM,
      score,
      details: {
        eventCount,
        maxEventsPerWindow: config.maxEventsPerWindow,
        windowMs: config.windowMs,
        threshold,
      },
      recommendation: `Unusual frequency of ${event.type} events: ${eventCount} in ${
        config.windowMs / 1000
      }s. Verify if this is legitimate.`,
    };
  }

  return null;
}

/**
 * Detect anomalies in security event
 */
export async function detectAnomalies(
  event: SecurityEvent,
  config: AnomalyDetectionConfig = DEFAULT_CONFIG
): Promise<AnomalyResult[]> {
  if (!config.enabled) {
    return [];
  }

  const anomalies: AnomalyResult[] = [];

  // Time-based detection
  if (config.timeBased) {
    const timeAnomaly = await detectTimeBasedAnomaly(event, config.timeBased);
    if (timeAnomaly) {
      anomalies.push(timeAnomaly);
    }
  }

  // Location-based detection
  if (config.locationBased) {
    const locationAnomaly = await detectLocationBasedAnomaly(event, config.locationBased);
    if (locationAnomaly) {
      anomalies.push(locationAnomaly);
    }
  }

  // Frequency-based detection
  if (config.frequencyBased) {
    const frequencyAnomaly = await detectFrequencyBasedAnomaly(event, config.frequencyBased);
    if (frequencyAnomaly) {
      anomalies.push(frequencyAnomaly);
    }
  }

  // Log detected anomalies
  for (const anomaly of anomalies) {
    await logSecurityEvent({
      type: 'suspicious_activity',
      severity: anomaly.severity,
      timestamp: Date.now(),
      identifier: event.identifier,
      endpoint: event.endpoint,
      details: {
        anomalyType: anomaly.type,
        anomalyScore: anomaly.score,
        originalEvent: event.type,
        ...anomaly.details,
      },
      metadata: {
        recommendation: anomaly.recommendation,
      },
    });

    logger.warn(
      `[anomaly-detection] Anomaly detected: ${anomaly.type} (score: ${anomaly.score})`,
      anomaly.details
    );
  }

  return anomalies;
}

/**
 * Initialize anomaly detection
 */
export async function initializeAnomalyDetection(
  config: AnomalyDetectionConfig = DEFAULT_CONFIG
): Promise<void> {
  if (!config.enabled) {
    return;
  }

  if (config.locationBased) {
    await initializeGeoIP(config.locationBased);
  }

  logger.info('[anomaly-detection] Anomaly detection initialized');
}
