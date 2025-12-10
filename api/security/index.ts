/**
 * Security Utilities
 * Centralized exports for all security modules
 *
 * Usage:
 *   import { withTimeout, SecurityLogger } from '@api/security/index.js';
 *   // or
 *   import { withTimeout } from '@api/security/request-timeout.js'; // Still works!
 */

// Anomaly Detection
export { AnomalyType } from './anomaly-detection.js';
export type { AnomalyResult, AnomalyDetectionConfig } from './anomaly-detection.js';
export { detectAnomalies, initializeAnomalyDetection } from './anomaly-detection.js';

// Certificate Monitoring
export type { CertificateInfo, CertificateChangeEvent } from './certificate-monitoring.js';
export {
  initializeCertificateMonitoring,
  isCertificateTrusted,
  monitorCertificates,
  getCertificateStatus,
  CertificateTransparencyMonitor,
} from './certificate-monitoring.js';

// CSRF Protection
export {
  generateCSRFToken,
  validateCSRFToken,
  addCSRFTokenHeader,
  extractCSRFToken,
  withCSRFProtection,
} from './csrf.js';

// Request Signing
export {
  signRequest,
  verifyRequest,
  createSignedRequest,
  verifySignedRequest,
  extractSignature,
} from './request-signing.js';

// Request Timeout
export { withTimeout } from './request-timeout.js';

// Secure Cookies
export type { SecureCookieOptions } from './secure-cookies.js';
export { createSecureCookie, setSecureCookie, clearCookie } from './secure-cookies.js';

// Security Monitor
export type { SecurityEventType, SecurityEvent, AlertThreshold } from './security-monitor.js';
export { SecurityEventSeverity } from './security-monitor.js';
export { logSecurityEvent, getSecurityEvents, SecurityLogger } from './security-monitor.js';
