/**
 * Certificate Transparency Monitoring
 * Monitors SSL/TLS certificate issuance for domain
 * Security Enhancement 9: Certificate Transparency Monitoring (HPKP Alternative)
 *
 * Note: HPKP (HTTP Public Key Pinning) is deprecated due to risks.
 * Certificate Transparency monitoring is the recommended alternative.
 */
import { SecurityEventSeverity } from './security-monitor.js';
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
    readonly type: 'new_certificate' | 'certificate_expiring' | 'certificate_expired' | 'unexpected_certificate';
    readonly domain: string;
    readonly certificate: CertificateInfo;
    readonly timestamp: number;
    readonly severity: SecurityEventSeverity;
}
/**
 * Initialize certificate monitoring
 * Should be called on application startup
 *
 * @param domains - Domains to monitor
 */
export declare function initializeCertificateMonitoring(domains: string[]): Promise<void>;
/**
 * Check certificate against known good certificates
 *
 * @param domain - Domain to check
 * @param certificate - Certificate to verify
 * @returns True if certificate is known and trusted
 */
export declare function isCertificateTrusted(domain: string, certificate: CertificateInfo): boolean;
/**
 * Monitor certificate changes
 * Should be called periodically (e.g., daily cron job)
 *
 * @param domains - Domains to monitor
 */
export declare function monitorCertificates(domains: string[]): Promise<void>;
/**
 * Get certificate monitoring status
 *
 * @param domain - Domain to check
 * @returns Monitoring status
 */
export declare function getCertificateStatus(domain: string): {
    readonly monitored: boolean;
    readonly knownCertificates: number;
    readonly lastChecked?: Date;
};
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
export declare class CertificateTransparencyMonitor {
    /**
     * Query Certificate Transparency logs for domain
     *
     * @param domain - Domain to query
     * @returns Array of certificate information
     */
    queryCTLogs(domain: string): Promise<CertificateInfo[]>;
    /**
     * Monitor CT logs for new certificates
     *
     * @param domain - Domain to monitor
     * @param callback - Callback when new certificate detected
     */
    monitorCTLogs(domain: string, callback: (certificate: CertificateInfo) => Promise<void>): Promise<void>;
}
//# sourceMappingURL=certificate-monitoring.d.ts.map