/**
 * Currency Conversion Handler
 * Converts currency amounts using exchange rate API
 * Includes security validation to prevent object injection attacks
 */
/**
 * Request object interface
 */
interface Request {
    readonly method: string;
    readonly query: {
        readonly amount?: string;
        readonly from?: string;
        readonly to?: string;
        [key: string]: string | undefined;
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
 * Currency conversion handler
 *
 * @param req - Request object
 * @param res - Response object
 * @returns Response with conversion result or error
 */
export default function handler(req: Request, res: Response): Promise<Response>;
export {};
//# sourceMappingURL=convert-currency.d.ts.map