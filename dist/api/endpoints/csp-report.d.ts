/**
 * Content Security Policy (CSP) Reporting Handler
 * Receives and processes CSP violation reports
 * Security Enhancement 8: CSP Reporting
 */
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
 * CSP report handler
 * Processes CSP violation reports from browsers
 *
 * @param req - Request object
 * @param res - Response object
 * @returns Response
 */
export declare function cspReportHandler(req: Request, res: Response): Promise<Response>;
/**
 * Get CSP report endpoint URL
 *
 * @param baseUrl - Base URL of the application
 * @returns CSP report endpoint URL
 */
export declare function getCSPReportUrl(baseUrl: string): string;
export {};
//# sourceMappingURL=csp-report.d.ts.map