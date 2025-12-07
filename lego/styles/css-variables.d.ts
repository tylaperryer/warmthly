/**
 * TypeScript definitions for CSS Custom Properties
 * Provides type-safe access to CSS variables from TypeScript
 * Auto-completion and type checking for all design tokens
 */

/**
 * CSS Custom Properties (Design Tokens)
 * These types match the variables defined in variables.css
 */
export interface CSSVariables {
  /* Colors */
  '--warmthly-orange': string;
  '--warmthly-orange-hover': string;
  '--warmthly-background': string;
  '--warmthly-background-alt': string;
  '--text-color': string;
  '--text-color-light': string;
  '--error-color': string;
  '--success-color': string;
  '--success-color-dark': string;
  '--error-red': string;
  '--error-red-dark': string;
  '--red-dot': string;
  '--green-dot': string;

  /* Stoplight/Dropdown Variables */
  '--tint-color': string;
  '--blur-radius': string;
  '--border-color': string;
  '--highlight-color': string;
  '--shadow-color': string;
  '--text-color-dark': string;

  /* Spacing System */
  '--spacing-1': string;
  '--spacing-2': string;
  '--spacing-3': string;
  '--spacing-4': string;
  '--spacing-5': string;
  '--spacing-6': string;
  '--spacing-8': string;
  '--spacing-10': string;
  '--spacing-12': string;
  '--spacing-16': string;
  '--spacing-20': string;
  '--spacing-24': string;
  '--spacing-xs': string;
  '--spacing-sm': string;
  '--spacing-md': string;
  '--spacing-lg': string;
  '--spacing-xl': string;
  '--spacing-2xl': string;
  '--spacing-3xl': string;

  /* Vertical Rhythm */
  '--baseline': string;
  '--line-height-base': string;
  '--line-height-tight': string;
  '--line-height-relaxed': string;

  /* Border Radius */
  '--radius-sm': string;
  '--radius-md': string;
  '--radius-lg': string;
  '--radius-xl': string;
  '--radius-full': string;

  /* Typography Scale */
  '--font-size-xs': string;
  '--font-size-sm': string;
  '--font-size-base': string;
  '--font-size-lg': string;
  '--font-size-xl': string;
  '--font-size-2xl': string;
  '--font-size-3xl': string;
  '--font-size-4xl': string;

  /* Letter Spacing */
  '--letter-spacing-tight': string;
  '--letter-spacing-normal': string;
  '--letter-spacing-wide': string;
  '--letter-spacing-wider': string;

  /* Z-index layers */
  '--z-base': string;
  '--z-dropdown': string;
  '--z-header': string;
  '--z-stoplight': string;
  '--z-modal': string;
  '--z-popup': string;
}

/**
 * Get CSS variable value from document root
 * Type-safe helper function
 * 
 * @param variable - CSS variable name (with -- prefix)
 * @returns CSS variable value or empty string
 * 
 * @example
 * ```typescript
 * const orange = getCSSVariable('--warmthly-orange');
 * ```
 */
export function getCSSVariable<K extends keyof CSSVariables>(
  variable: K
): string {
  if (typeof document === 'undefined') {
    return '';
  }

  return getComputedStyle(document.documentElement).getPropertyValue(variable) || '';
}

/**
 * Set CSS variable value on document root
 * Type-safe helper function
 * 
 * @param variable - CSS variable name (with -- prefix)
 * @param value - Value to set
 * 
 * @example
 * ```typescript
 * setCSSVariable('--warmthly-orange', '#FF8C42');
 * ```
 */
export function setCSSVariable<K extends keyof CSSVariables>(
  variable: K,
  value: string
): void {
  if (typeof document === 'undefined') {
    return;
  }

  document.documentElement.style.setProperty(variable, value);
}

