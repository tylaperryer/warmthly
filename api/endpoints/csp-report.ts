/**
 * Content Security Policy (CSP) Reporting Handler
 * Receives and processes CSP violation reports
 * Security Enhancement 8: CSP Reporting
 */

import { logSecurityEvent, SecurityEventSeverity } from '../security/security-monitor.js';
import logger from '../utils/logger.js';

/**
 * Request object interface
 */
interface Request {
  readonly method: string;
  readonly body: {
    readonly 'csp-report'?: CSPViolationReport;
    readonly [key: string]: unknown;
  };
  readonly headers?: {
    readonly 'x-forwarded-for'?: string;
    readonly 'x-real-ip'?: string;
    readonly [key: string]: string | undefined;
  };
  [key: string]: unknown;
}

/**
 * Response object interface
 */
interface Response {
  status: (code: number) => Response;
  json: (data: unknown) => Response;
  [key: string]: unknown;
}

/**
 * CSP violation report structure
 * Based on CSP reporting specification
 */
interface CSPViolationReport {
  readonly 'document-uri'?: string;
  readonly referrer?: string;
  readonly 'violated-directive'?: string;
  readonly 'effective-directive'?: string;
  readonly 'original-policy'?: string;
  readonly disposition?: 'enforce' | 'report';
  readonly 'blocked-uri'?: string;
  readonly 'status-code'?: number;
  readonly 'source-file'?: string;
  readonly 'line-number'?: number;
  readonly 'column-number'?: number;
  readonly 'script-sample'?: string;
}

/**
 * Get client identifier from request
 */
function getClientIdentifier(req: Request): string {
  const forwardedFor = req.headers?.['x-forwarded-for'];
  if (forwardedFor) {
    const firstIp = forwardedFor.split(',')[0]?.trim();
    if (firstIp) {
      return firstIp;
    }
  }

  const realIp = req.headers?.['x-real-ip'];
  if (realIp) {
    return realIp;
  }

  return 'unknown';
}

/**
 * Analyze CSP violation and determine severity
 */
function analyzeViolation(report: CSPViolationReport): {
  severity: SecurityEventSeverity;
  suspicious: boolean;
} {
  const violatedDirective = report['violated-directive'] || '';
  const blockedUri = report['blocked-uri'] || '';
  const scriptSample = report['script-sample'] || '';

  // Critical: Script injection attempts
  if (
    violatedDirective.includes('script-src') &&
    (blockedUri.includes('javascript:') ||
      blockedUri.includes('data:') ||
      scriptSample.includes('<script') ||
      scriptSample.includes('eval(') ||
      scriptSample.includes('Function('))
  ) {
    return { severity: SecurityEventSeverity.CRITICAL, suspicious: true };
  }

  // High: Style injection or frame violations
  if (
    violatedDirective.includes('style-src') ||
    violatedDirective.includes('frame-src') ||
    violatedDirective.includes('frame-ancestors')
  ) {
    return { severity: SecurityEventSeverity.HIGH, suspicious: true };
  }

  // Medium: Other policy violations
  if (violatedDirective.includes('connect-src') || violatedDirective.includes('img-src')) {
    return { severity: SecurityEventSeverity.MEDIUM, suspicious: false };
  }

  // Low: Other violations
  return { severity: SecurityEventSeverity.LOW, suspicious: false };
}

/**
 * CSP report handler
 * Processes CSP violation reports from browsers
 *
 * @param req - Request object
 * @param res - Response object
 * @returns Response
 */
export async function cspReportHandler(req: Request, res: Response): Promise<Response> {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: { message: 'Method Not Allowed' } });
  }

  try {
    const cspReport = req.body['csp-report'];

    if (!cspReport) {
      return res.status(400).json({ error: { message: 'Missing CSP report' } });
    }

    const identifier = getClientIdentifier(req);
    const analysis = analyzeViolation(cspReport);

    // Log CSP violation
    logger.warn('[CSP Report] Violation detected', {
      identifier,
      violatedDirective: cspReport['violated-directive'],
      blockedUri: cspReport['blocked-uri'],
      documentUri: cspReport['document-uri'],
      sourceFile: cspReport['source-file'],
      lineNumber: cspReport['line-number'],
      scriptSample: cspReport['script-sample'],
      severity: analysis.severity,
      suspicious: analysis.suspicious,
    });

    // If suspicious, log as security event
    if (analysis.suspicious) {
      await logSecurityEvent({
        type: 'xss_attempt',
        severity: analysis.severity,
        timestamp: Date.now(),
        identifier,
        endpoint: cspReport['document-uri'],
        details: {
          violatedDirective: cspReport['violated-directive'],
          blockedUri: cspReport['blocked-uri'],
          scriptSample: cspReport['script-sample'],
          sourceFile: cspReport['source-file'],
          lineNumber: cspReport['line-number'],
        },
      });
    }

    // Return 204 No Content (CSP spec requirement)
    return res.status(204).json({});
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error('[csp-report] Error processing CSP report:', errorMessage);

    // Still return 204 to prevent browser retries
    return res.status(204).json({});
  }
}

/**
 * Get CSP report endpoint URL
 *
 * @param baseUrl - Base URL of the application
 * @returns CSP report endpoint URL
 */
export function getCSPReportUrl(baseUrl: string): string {
  return `${baseUrl}/api/csp-report`;
}
