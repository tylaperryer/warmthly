/**
 * Type declarations for Node.js globals
 * This file provides type definitions for Node.js built-ins
 * when @types/node is not available or not properly configured
 */

declare namespace NodeJS {
  interface ProcessEnv {
    [key: string]: string | undefined;
    NODE_ENV?: 'development' | 'production' | 'test';
    ADMIN_PASSWORD?: string;
    JWT_SECRET?: string;
  }
}

declare var process: {
  env: NodeJS.ProcessEnv;
  [key: string]: unknown;
};

