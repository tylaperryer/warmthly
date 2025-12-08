/**
 * Test Utilities and Helpers
 * Shared utilities for testing across the codebase
 * Phase 5 Issue 5.7: Missing Test Utilities and Helpers
 */

/**
 * Mock Request object for API endpoint testing
 */
export interface MockRequest {
  method: string;
  url: string;
  body?: unknown;
  headers?: Record<string, string>;
  query?: Record<string, string>;
  connection?: {
    remoteAddress?: string;
  };
  [key: string]: unknown;
}

/**
 * Mock Response object for API endpoint testing
 */
export interface MockResponse {
  statusCode: number;
  headers: Record<string, string | number>;
  body: unknown;
  status: (code: number) => MockResponse;
  json: (data: unknown) => MockResponse;
  setHeader: (name: string, value: string | number) => void;
  headersSent: boolean;
  [key: string]: unknown;
}

/**
 * Create a mock request object
 *
 * @param options - Request options
 * @returns Mock request object
 */
export function createMockRequest(options: Partial<MockRequest> = {}): MockRequest {
  return {
    method: options.method || 'GET',
    url: options.url || '/api/test',
    body: options.body,
    headers: options.headers || {},
    query: options.query || {},
    connection: options.connection || {},
    ...options,
  };
}

/**
 * Create a mock response object
 *
 * @returns Mock response object
 */
export function createMockResponse(): MockResponse {
  const response: MockResponse = {
    statusCode: 200,
    headers: {},
    body: null,
    headersSent: false,
    status: function (code: number) {
      this.statusCode = code;
      return this;
    },
    json: function (data: unknown) {
      this.body = data;
      this.headersSent = true;
      return this;
    },
    setHeader: function (name: string, value: string | number) {
      this.headers[name] = value;
      return this;
    },
  };

  return response;
}

/**
 * Create a mock fetch response
 *
 * @param data - Response data
 * @param options - Response options
 * @returns Mock fetch response
 */
export function createMockFetchResponse(
  data: unknown,
  options: {
    status?: number;
    statusText?: string;
    headers?: Record<string, string>;
  } = {}
): Response {
  const { status = 200, statusText = 'OK', headers = {} } = options;

  return {
    ok: status >= 200 && status < 300,
    status,
    statusText,
    headers: new Headers(headers),
    json: async () => data,
    text: async () => (typeof data === 'string' ? data : JSON.stringify(data)),
    blob: async () => new Blob([JSON.stringify(data)]),
    arrayBuffer: async () => new TextEncoder().encode(JSON.stringify(data)).buffer,
    clone: function () {
      return this;
    },
    body: null,
    bodyUsed: false,
    redirected: false,
    type: 'default',
    url: '',
  } as Response;
}

/**
 * Wait for a specified amount of time (for testing async operations)
 *
 * @param ms - Milliseconds to wait
 * @returns Promise that resolves after the delay
 */
export function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Create test data factory for common test objects
 */
export const TestDataFactory = {
  /**
   * Create a test user object
   */
  createUser: (overrides: Partial<{ id: string; email: string; name: string }> = {}) => ({
    id: 'test-user-1',
    email: 'test@example.com',
    name: 'Test User',
    ...overrides,
  }),

  /**
   * Create a test payment object
   */
  createPayment: (
    overrides: Partial<{ amount: number; currency: string; id: string }> = {}
  ) => ({
    id: 'test-payment-1',
    amount: 10000,
    currency: 'ZAR',
    ...overrides,
  }),

  /**
   * Create a test report object
   */
  createReport: (
    overrides: Partial<{ name: string; email: string; type: string; message: string }> = {}
  ) => ({
    name: 'Test User',
    email: 'test@example.com',
    type: 'concern',
    message: 'Test report message',
    ...overrides,
  }),

  /**
   * Create a test email object
   */
  createEmail: (
    overrides: Partial<{ from: string; to: string; subject: string; body: string }> = {}
  ) => ({
    from: 'sender@example.com',
    to: 'recipient@example.com',
    subject: 'Test Email',
    body: 'Test email body',
    ...overrides,
  }),
};

/**
 * Assert that a value is an error with a specific message
 *
 * @param value - Value to check
 * @param message - Expected error message (optional)
 */
export function expectError(value: unknown, message?: string): asserts value is Error {
  if (!(value instanceof Error)) {
    throw new Error(`Expected Error, got ${typeof value}`);
  }
  if (message && value.message !== message) {
    throw new Error(`Expected error message "${message}", got "${value.message}"`);
  }
}

/**
 * Assert that a response has the expected status code
 *
 * @param response - Response object
 * @param expectedStatus - Expected status code
 */
export function expectStatus(response: { statusCode?: number; status?: number }, expectedStatus: number): void {
  const status = response.statusCode || response.status;
  if (status !== expectedStatus) {
    throw new Error(`Expected status ${expectedStatus}, got ${status}`);
  }
}

/**
 * Assert that a response has the expected error code
 *
 * @param response - Response body
 * @param expectedCode - Expected error code
 */
export function expectErrorCode(response: { error?: { code?: string } }, expectedCode: string): void {
  if (!response.error || response.error.code !== expectedCode) {
    throw new Error(`Expected error code "${expectedCode}", got "${response.error?.code || 'none'}"`);
  }
}

