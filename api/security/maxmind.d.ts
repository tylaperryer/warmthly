/**
 * Type declarations for optional maxmind dependency
 * This allows TypeScript to compile even when maxmind is not installed
 */

declare module 'maxmind' {
  interface GeoIP2Response {
    country?: {
      iso_code?: string;
    };
    city?: {
      names?: {
        en?: string;
      };
    };
    location?: {
      latitude?: number;
      longitude?: number;
    };
  }

  interface Reader {
    get(ip: string): GeoIP2Response | null;
  }

  export function open(dbPath: string): Promise<Reader>;
}

