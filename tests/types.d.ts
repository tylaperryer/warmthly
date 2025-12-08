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

declare var process: Process;

// Vitest types (when vitest is not available)
declare module 'vitest' {
  export function describe(name: string, fn: () => void): void;
  export namespace describe {
    function skip(name: string, fn: () => void): void;
  }
  export function it(name: string, fn: () => void | Promise<void>): void;
  export function beforeEach(fn: () => void | Promise<void>): void;
  export function afterEach(fn: () => void | Promise<void>): void;
  export const expect: any;
  export const vi: any;
}

// Resend module declaration
declare module 'resend' {
  export class Resend {
    constructor(apiKey?: string);
    webhooks: {
      verify(payload: string, headers: Record<string, string>): { type: string; data: any };
    };
  }
}

// Playwright types (when @playwright/test is not available)
declare module '@playwright/test' {
  export const test: any;
  export const expect: any;
  export type Page = any;
}

// Axe-core types (when @axe-core/playwright is not available)
declare module '@axe-core/playwright' {
  export function injectAxe(page: any): Promise<void>;
  export function checkA11y(page: any, context: any, options?: any): Promise<void>;
}
