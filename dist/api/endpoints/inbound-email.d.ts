/**
 * Inbound Email Handler
 * Processes webhook events from Resend for incoming emails
 * Stores emails in Redis for retrieval
 */
/**
 * Request object interface
 */
interface Request {
    readonly method: string;
    readonly headers: {
        readonly 'svix-signature'?: string;
        readonly 'svix-id'?: string;
        readonly 'svix-timestamp'?: string;
        [key: string]: string | undefined;
    };
    readonly body?: unknown;
    on: (event: string, callback: (chunk?: Buffer) => void) => void;
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
 * Inbound email handler
 * Processes Resend webhook events
 *
 * @param req - Request object
 * @param res - Response object
 * @returns Response with success or error
 */
export default function handler(req: Request, res: Response): Promise<Response>;
export {};
//# sourceMappingURL=inbound-email.d.ts.map