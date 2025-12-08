/**
 * Yoco Public Key Handler
 * Returns Yoco payment gateway public key for client-side use
 * Public key is safe to expose to clients
 */
/**
 * Request object interface
 */
interface Request {
    readonly method: string;
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
 * Handler function type
 */
type Handler = (req: Request, res: Response) => Response | Promise<Response>;
/**
 * Get Yoco public key handler
 * Returns the Yoco public key for client-side payment integration
 *
 * @param req - Request object
 * @param res - Response object
 * @returns Response with public key or error
 *
 * @example
 * ```typescript
 * export default handler;
 * ```
 */
declare const handler: Handler;
export default handler;
//# sourceMappingURL=get-yoco-public-key.d.ts.map