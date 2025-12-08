# Design Tokens

Complete reference for all design tokens used in the Warmthly design system.

## Colors

### Brand Colors

- `--warmthly-orange`: `#FF8C42` - Primary brand color
- `--warmthly-orange-hover`: `#e07a35` - Hover state
- `--warmthly-background`: `#fff6f1` - Main background
- `--warmthly-background-alt`: `#ffeee6` - Alternate background

### Text Colors

- `--text-color`: `#1a1a1a` - Primary text (16.8:1 contrast)
- `--text-color-light`: `rgba(26, 26, 26, 0.75)` - Secondary text (12.6:1 contrast)
- `--text-color-dark`: `#1c2526` - Dark text variant

### Status Colors

- `--error-color`: `#D8000C` - Error state
- `--error-red`: `#ff6b6b` - Error variant
- `--error-red-dark`: `#ee5a6f` - Error dark variant
- `--success-color`: `#2ed573` - Success state
- `--success-color-dark`: `#27ae60` - Success dark variant
- `--red-dot`: `#ff4757` - Red indicator
- `--green-dot`: `#2ed573` - Green indicator

### UI Colors

- `--tint-color`: `rgba(255, 255, 255, 0.15)` - Glass effect tint
- `--border-color`: `rgba(255, 255, 255, 0.25)` - Border color
- `--highlight-color`: `rgba(255, 255, 255, 0.4)` - Highlight color
- `--shadow-color`: `rgba(0, 0, 0, 0.08)` - Shadow color

## Spacing

### Base Spacing (8pt Grid)

- `--spacing-1`: `0.25rem` (4px) - Tight
- `--spacing-2`: `0.5rem` (8px) - Compact
- `--spacing-3`: `0.75rem` (12px) - Snug
- `--spacing-4`: `1rem` (16px) - Base
- `--spacing-5`: `1.25rem` (20px)
- `--spacing-6`: `1.5rem` (24px) - Comfortable
- `--spacing-8`: `2rem` (32px) - Spacious
- `--spacing-10`: `2.5rem` (40px)
- `--spacing-12`: `3rem` (48px) - Generous
- `--spacing-16`: `4rem` (64px) - Expansive
- `--spacing-20`: `5rem` (80px) - Vast
- `--spacing-24`: `6rem` (96px) - Monumental

### Semantic Spacing

- `--spacing-xs`: `var(--spacing-2)` (8px)
- `--spacing-sm`: `var(--spacing-4)` (16px)
- `--spacing-md`: `var(--spacing-6)` (24px)
- `--spacing-lg`: `var(--spacing-8)` (32px)
- `--spacing-xl`: `var(--spacing-12)` (48px)
- `--spacing-2xl`: `var(--spacing-16)` (64px)
- `--spacing-3xl`: `var(--spacing-24)` (96px)

## Typography

### Font Sizes

- `--font-size-xs`: `0.875rem` (14px)
- `--font-size-sm`: `0.9375rem` (15px)
- `--font-size-base`: `1rem` (16px)
- `--font-size-lg`: `1.125rem` (18px)
- `--font-size-xl`: `1.5rem` (24px)
- `--font-size-2xl`: `1.875rem` (30px)
- `--font-size-3xl`: `2.5rem` (40px)
- `--font-size-4xl`: `3.5rem` (56px)

### Line Height

- `--line-height-base`: `1.618` - Golden ratio
- `--line-height-tight`: `1.4`
- `--line-height-relaxed`: `1.75`
- `--baseline`: `1.5rem` (24px) - Baseline grid

### Letter Spacing

- `--letter-spacing-tight`: `-0.02em`
- `--letter-spacing-normal`: `0`
- `--letter-spacing-wide`: `0.02em`
- `--letter-spacing-wider`: `0.05em`

## Border Radius

- `--radius-sm`: `10px`
- `--radius-md`: `14px`
- `--radius-lg`: `18px`
- `--radius-xl`: `20px`
- `--radius-full`: `50px`

## Z-Index Layers

- `--z-base`: `1`
- `--z-dropdown`: `1000`
- `--z-header`: `1001`
- `--z-stoplight`: `1002`
- `--z-modal`: `10000`
- `--z-popup`: `100000`

## Effects

### Blur

- `--blur-radius`: `12px` - Glass effect blur

## Dark Mode

All colors automatically adapt to dark mode via `@media (prefers-color-scheme: dark)`. The design system respects user preferences without requiring manual toggles.

## Usage

```css
.my-component {
  padding: var(--spacing-md);
  color: var(--text-color);
  background: var(--warmthly-background);
  border-radius: var(--radius-md);
  font-size: var(--font-size-base);
  line-height: var(--line-height-base);
}
```
