/**
 * Type declarations for test environment
 * Provides types when node_modules is not available
 */

// Node.js process type (when @types/node is not available)
declare namespace NodeJS {
  interface ProcessEnv {
    [key: string]: string | undefined;
    YOCO_SECRET_KEY?: string;
  }
}

interface Process {
  env: NodeJS.ProcessEnv;
}

declare let process: Process;

// Vitest types (when vitest is not available)
declare module 'vitest' {
  export function describe(name: string, fn: () => void): void;
  export namespace describe {
    function skip(name: string, fn: () => void): void;
  }
  export function it(name: string, fn: () => void | Promise<void>): void;
  export function beforeEach(fn: () => void | Promise<void>): void;
  export function afterEach(fn: () => void | Promise<void>): void;
  export const expect: {
    (value: unknown): {
      toBe: (expected: unknown) => void;
      toHaveBeenCalled: () => void;
      toHaveBeenCalledWith: (...args: unknown[]) => void;
      toThrow: (expected?: string | Error) => void;
      rejects: {
        toThrow: (expected?: string | Error) => Promise<void>;
      };
    };
  };
  export const vi: {
    fn: <T extends (...args: unknown[]) => unknown>(
      impl?: T
    ) => T & { mockResolvedValue: (value: unknown) => T; mockReturnValue: (value: unknown) => T };
    spyOn: (
      obj: unknown,
      method: string
    ) => { mockImplementation: (fn: unknown) => unknown; mockRestore: () => void };
    clearAllMocks: () => void;
  };
}

// Resend module declaration
declare module 'resend' {
  export class Resend {
    constructor(apiKey?: string);
    webhooks: {
      verify(
        payload: string,
        headers: Record<string, string>
      ): { type: string; data: Record<string, unknown> };
    };
  }
}

// Playwright types (when @playwright/test is not available)
declare module '@playwright/test' {
  export interface Page {
    goto: (url: string) => Promise<void>;
    click: (selector: string) => Promise<void>;
    fill: (selector: string, value: string) => Promise<void>;
    waitForSelector: (selector: string) => Promise<void>;
    locator: (selector: string) => any;
    waitForTimeout: (ms: number) => Promise<void>;
    waitForLoadState: (state: string) => Promise<void>;
    setViewportSize: (size: { width: number; height: number }) => Promise<void>;
    evaluate: (fn: (...args: any[]) => any, ...args: any[]) => Promise<any>;
    route: (url: string, handler: (route: any) => void) => Promise<void>;
    url: () => string;
    keyboard: { press: (key: string) => Promise<void> };
    [key: string]: any;
  }

  export interface TestFixtures {
    page: Page;
    baseURL?: string | undefined;
    [key: string]: any;
  }

  export function test(name: string, fn: (fixtures: TestFixtures) => void | Promise<void>): void;

  export namespace test {
    function beforeEach(fn: (fixtures: TestFixtures) => void | Promise<void>): void;
    function use(options: any): void;
  }

  export const expect: {
    (value: unknown): {
      toBe: (expected: unknown) => void;
      toHaveTextContent: (text: string) => void;
      toBeVisible: () => void;
      toHaveTitle: (title: string | RegExp) => void;
      toHaveAttribute: (name: string, value?: string) => void;
      toHaveValue: (value: string) => void;
      toBeTruthy: () => void;
      toBeDefined: () => void;
      toContain: (value: string) => void;
      toBeGreaterThan: (value: number) => void;
      toBeGreaterThanOrEqual: (value: number) => void;
      toBeLessThan: (value: number) => void;
      toBeLessThanOrEqual: (value: number) => void;
      not: {
        toBeVisible: () => void;
        toContain: (value: string) => void;
        [key: string]: any;
      };
      [key: string]: any;
    };
  };
}

// Axe-core types (when @axe-core/playwright is not available)
declare module '@axe-core/playwright' {
  export function injectAxe(page: { evaluate: (fn: () => void) => Promise<void> }): Promise<void>;
  export function checkA11y(
    page: unknown,
    context: unknown,
    options?: Record<string, unknown>
  ): Promise<void>;
}

// Testing library types
declare module '@testing-library/dom' {
  export function waitFor(
    callback: () => void | Promise<void>,
    options?: Record<string, unknown>
  ): Promise<void>;
}

// Redis client module
declare module '@api/redis-client.js' {
  export function getRedisClient(): Promise<unknown>;
}
