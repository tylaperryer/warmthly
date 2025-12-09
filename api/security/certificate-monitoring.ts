/**
 * Certificate Transparency Monitoring
 * Monitors SSL/TLS certificate issuance for domain
 * Security Enhancement 9: Certificate Transparency Monitoring (HPKP Alternative)
 *
 * Note: HPKP (HTTP Public Key Pinning) is deprecated due to risks.
 * Certificate Transparency monitoring is the recommended alternative.
 */

import logger from '../utils/logger.js';

import { logSecurityEvent, SecurityEventSeverity } from './security-monitor.js';

/**
 * Certificate information
 */
export interface CertificateInfo {
  readonly domain: string;
  readonly issuer: string;
  readonly serialNumber: string;
  readonly notBefore: Date;
  readonly notAfter: Date;
  readonly fingerprint: string;
  readonly subjectAlternativeNames?: string[];
}

/**
 * Certificate change event
 */
export interface CertificateChangeEvent {
  readonly type:
    | 'new_certificate'
    | 'certificate_expiring'
    | 'certificate_expired'
    | 'unexpected_certificate';
  readonly domain: string;
  readonly certificate: CertificateInfo;
  readonly timestamp: number;
  readonly severity: SecurityEventSeverity;
}

/**
 * Known good certificate fingerprints
 * Should be populated from current certificates
 */
const KNOWN_CERTIFICATES: Map<string, string[]> = new Map();

/**
 * Initialize certificate monitoring
 * Should be called on application startup
 *
 * @param domains - Domains to monitor
 */
export async function initializeCertificateMonitoring(domains: string[]): Promise<void> {
  for (const domain of domains) {
    try {
      // Fetch current certificate
      const cert = await fetchCurrentCertificate(domain);
      if (cert) {
        // Store as known good certificate
        const existing = KNOWN_CERTIFICATES.get(domain) || [];
        if (!existing.includes(cert.fingerprint)) {
          KNOWN_CERTIFICATES.set(domain, [...existing, cert.fingerprint]);
        }
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(`[certificate-monitoring] Error initializing for ${domain}:`, errorMessage);
    }
  }
}

/**
 * Fetch current certificate for a domain
 *
 * @param domain - Domain to check
 * @returns Certificate information or null
 */
function fetchCurrentCertificate(_domain: string): Promise<CertificateInfo | null> {
  // In a real implementation, you would:
  // 1. Use a Certificate Transparency API (e.g., crt.sh, Google's CT API)
  // 2. Or use a library like node-forge to fetch certificate from TLS connection
  // 3. Or use a service like Let's Encrypt's CT logs

  // For now, this is a placeholder that would need to be implemented
  // based on your infrastructure and monitoring needs

  logger.warn(
    `[certificate-monitoring] Certificate fetching not fully implemented`
  );
  return Promise.resolve(null);
}

/**
 * Check certificate against known good certificates
 *
 * @param domain - Domain to check
 * @param certificate - Certificate to verify
 * @returns True if certificate is known and trusted
 */
export function isCertificateTrusted(domain: string, certificate: CertificateInfo): boolean {
  const knownFingerprints = KNOWN_CERTIFICATES.get(domain);
  if (!knownFingerprints || knownFingerprints.length === 0) {
    // No known certificates - first time setup
    return true;
  }

  return knownFingerprints.includes(certificate.fingerprint);
}

/**
 * Monitor certificate changes
 * Should be called periodically (e.g., daily cron job)
 *
 * @param domains - Domains to monitor
 */
export async function monitorCertificates(domains: string[]): Promise<void> {
  for (const domain of domains) {
    try {
      const currentCert = await fetchCurrentCertificate(domain);
      if (!currentCert) {
        continue;
      }

      const knownFingerprints = KNOWN_CERTIFICATES.get(domain) || [];

      // Check if this is a new certificate
      if (knownFingerprints.length > 0 && !knownFingerprints.includes(currentCert.fingerprint)) {
        // New certificate detected
        await handleCertificateChange({
          type: 'unexpected_certificate',
          domain,
          certificate: currentCert,
          timestamp: Date.now(),
          severity: SecurityEventSeverity.CRITICAL,
        });
      }

      // Check if certificate is expiring soon (within 30 days)
      const daysUntilExpiry = (currentCert.notAfter.getTime() - Date.now()) / (1000 * 60 * 60 * 24);
      if (daysUntilExpiry > 0 && daysUntilExpiry < 30) {
        await handleCertificateChange({
          type: 'certificate_expiring',
          domain,
          certificate: currentCert,
          timestamp: Date.now(),
          severity: SecurityEventSeverity.MEDIUM,
        });
      }

      // Check if certificate is expired
      if (currentCert.notAfter.getTime() < Date.now()) {
        await handleCertificateChange({
          type: 'certificate_expired',
          domain,
          certificate: currentCert,
          timestamp: Date.now(),
          severity: SecurityEventSeverity.CRITICAL,
        });
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(`[certificate-monitoring] Error monitoring ${domain}:`, errorMessage);
    }
  }
}

/**
 * Handle certificate change event
 *
 * @param event - Certificate change event
 */
async function handleCertificateChange(event: CertificateChangeEvent): Promise<void> {
  logger.error(`[Certificate Monitoring] ${event.type} for ${event.domain}`, {
    type: event.type,
    domain: event.domain,
    issuer: event.certificate.issuer,
    serialNumber: event.certificate.serialNumber,
    notAfter: event.certificate.notAfter.toISOString(),
    fingerprint: event.certificate.fingerprint,
  });

  // Log as security event
  await logSecurityEvent({
    type: 'suspicious_activity',
    severity: event.severity,
    timestamp: event.timestamp,
    identifier: event.domain,
    details: {
      certificateChange: event.type,
      issuer: event.certificate.issuer,
      serialNumber: event.certificate.serialNumber,
      notAfter: event.certificate.notAfter.toISOString(),
      fingerprint: event.certificate.fingerprint,
    },
  });

  // TODO: Send alerts via email, Slack, etc.
}

/**
 * Get certificate monitoring status
 *
 * @param domain - Domain to check
 * @returns Monitoring status
 */
export function getCertificateStatus(domain: string): {
  readonly monitored: boolean;
  readonly knownCertificates: number;
  readonly lastChecked?: Date;
} {
  const knownFingerprints = KNOWN_CERTIFICATES.get(domain);
  return {
    monitored: KNOWN_CERTIFICATES.has(domain),
    knownCertificates: knownFingerprints?.length || 0,
  };
}

/**
 * Certificate Transparency API integration
 *
 * This is a placeholder for integrating with CT log APIs such as:
 * - crt.sh (https://crt.sh/)
 * - Google's Certificate Transparency API
 * - Let's Encrypt CT logs
 *
 * Example implementation would query these APIs to monitor certificate issuance
 */
export class CertificateTransparencyMonitor {
  /**
   * Query Certificate Transparency logs for domain
   *
   * @param domain - Domain to query
   * @returns Array of certificate information
   */
  queryCTLogs(_domain: string): Promise<CertificateInfo[]> {
    // Placeholder - would integrate with actual CT log API
    logger.warn('[certificate-monitoring] CT log querying not implemented');
    return Promise.resolve([]);
  }

  /**
   * Monitor CT logs for new certificates
   *
   * @param domain - Domain to monitor
   * @param callback - Callback when new certificate detected
   */
  monitorCTLogs(
    _domain: string,
    _callback: (certificate: CertificateInfo) => Promise<void>
  ): Promise<void> {
    // Placeholder - would set up periodic monitoring
    logger.warn('[certificate-monitoring] CT log monitoring not implemented');
    return Promise.resolve();
  }
}
