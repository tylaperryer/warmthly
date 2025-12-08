# Asset Optimization Guide

Complete guide for optimizing images, fonts, and other assets in the Warmthly project.

## Overview

Optimizing assets is crucial for performance. This guide covers:
- Image optimization (formats, sizes, responsive images)
- Font optimization (subsetting, loading strategies)
- Asset organization and naming conventions
- Tools and scripts available

## Image Optimization

### Supported Formats

Warmthly supports multiple image formats with automatic fallbacks:

1. **AVIF** (preferred) - Best compression, modern browsers only
2. **WebP** (fallback) - Good compression, wide browser support
3. **PNG/JPEG** (final fallback) - Universal support

### Image Optimization Workflow

#### 1. Prepare Source Images

- Use high-quality source images (at least 2x the display size)
- Save as PNG for graphics/logos, JPEG for photos
- Keep source files in `warmthly/assets/images/`

#### 2. Run Optimization Script

```bash
npm run optimize:images
```

This script:
- Finds all PNG/JPEG images in `assets/images/`
- Converts to WebP and AVIF formats
- Preserves original files
- Skips already-converted images

**Requirements:**
- `sharp` package installed: `npm install --save-dev sharp`

#### 3. Use Responsive Images in HTML

Use `<picture>` elements with format and size fallbacks:

```html
<picture>
  <source srcset="image.avif" type="image/avif" />
  <source srcset="image.webp" type="image/webp" />
  <img src="image.png" alt="Description" loading="lazy" />
</picture>
```

### Image Size Guidelines

| Use Case | Recommended Size | Max File Size |
|----------|-----------------|---------------|
| Hero images | 1920×1080px | 200KB |
| Thumbnails | 400×300px | 50KB |
| Icons | 64×64px | 10KB |
| OG images | 1200×630px | 300KB |
| Favicons | 32×32px | 5KB |

### Responsive Image Breakpoints

Use `srcset` for responsive images:

```html
<img
  srcset="
    image-320w.webp 320w,
    image-640w.webp 640w,
    image-1024w.webp 1024w,
    image-1920w.webp 1920w
  "
  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
  src="image-1024w.webp"
  alt="Description"
  loading="lazy"
/>
```

### Lazy Loading

Always use lazy loading for images below the fold:

```html
<img src="image.jpg" alt="Description" loading="lazy" />
```

For LCP (Largest Contentful Paint) images, use eager loading:

```html
<img src="hero.jpg" alt="Hero" loading="eager" fetchpriority="high" />
```

### Image Optimization Utilities

The project includes image optimization utilities in `warmthly/lego/utils/image-optimization.ts`:

```typescript
import { generateResponsiveImage } from '@utils/image-optimization.js';

// Generate responsive image markup
const imageMarkup = generateResponsiveImage({
  src: '/assets/images/hero.jpg',
  alt: 'Hero image',
  width: 1920,
  height: 1080,
  loading: 'lazy',
  isLCP: false,
});
```

## Font Optimization

### Font Subsetting

Font files should be subset to include only used characters:

```bash
npm run subset:fonts
```

This script:
- Subsets fonts to include only required characters
- Creates optimized WOFF2 files
- Requires `pyftsubset` or `glyphhanger` (see script for details)

### Font Loading Strategy

Use `<warmthly-font-loader>` component for optimal font loading:

```html
<warmthly-font-loader></warmthly-font-loader>
```

This component:
- Preloads critical fonts
- Uses `font-display: swap` for better perceived performance
- Loads fonts asynchronously

### Font File Guidelines

| Font Type | Format | Max Size |
|-----------|--------|----------|
| Variable fonts | WOFF2 | 200KB |
| Static fonts | WOFF2 | 100KB |
| Icon fonts | WOFF2 | 50KB |

### Font Preloading

Preload critical fonts in `<head>`:

```html
<link rel="preload" href="/assets/fonts/inter.woff2" as="font" type="font/woff2" crossorigin />
```

## Asset Organization

### Directory Structure

```
warmthly/assets/
├── fonts/          # Font files (WOFF2)
├── images/         # Image files
│   ├── og/         # Open Graph images (optional, dynamic generator available)
│   └── ...         # Other images
└── icons/          # Icon files (SVG preferred)
```

### Naming Conventions

- **Images**: Use kebab-case, descriptive names
  - ✅ `hero-image.jpg`
  - ✅ `logo-warmthly.png`
  - ❌ `IMG_001.jpg`
  - ❌ `image1.png`

- **Fonts**: Use family-name-weight.woff2
  - ✅ `inter-regular.woff2`
  - ✅ `cormorant-bold.woff2`

- **Icons**: Use descriptive names
  - ✅ `icon-arrow-right.svg`
  - ✅ `icon-close.svg`

### File Size Limits

| Asset Type | Max Size | Action if Exceeded |
|------------|----------|-------------------|
| Images | 500KB | Optimize or compress |
| Fonts | 200KB | Subset fonts |
| Icons | 50KB | Optimize SVG |

## Tools and Scripts

### Available Scripts

```bash
# Optimize images (WebP, AVIF)
npm run optimize:images

# Subset fonts
npm run subset:fonts

# Check bundle sizes
npm run build:size

# Analyze bundle
npm run build:analyze
```

### External Tools

- **TinyPNG** - Online image compression: https://tinypng.com
- **Squoosh** - Image optimization: https://squoosh.app
- **SVGOMG** - SVG optimization: https://jakearchibald.github.io/svgomg/
- **Font Squirrel** - Font subsetting: https://www.fontsquirrel.com/tools/webfont-generator

## Best Practices

### 1. Always Optimize Before Adding

- Run images through optimization tools
- Subset fonts to required characters
- Compress SVG files

### 2. Use Modern Formats

- Prefer AVIF/WebP over PNG/JPEG
- Use WOFF2 for fonts
- Use SVG for icons when possible

### 3. Implement Responsive Images

- Use `<picture>` elements with format fallbacks
- Use `srcset` for size variants
- Specify `sizes` attribute

### 4. Lazy Load Non-Critical Assets

- Use `loading="lazy"` for below-fold images
- Defer font loading when possible
- Load icons on demand

### 5. Monitor Asset Sizes

- Check bundle sizes regularly
- Set performance budgets
- Optimize assets that exceed limits

## Performance Budgets

The project enforces performance budgets:

- **JavaScript files**: Max 500KB per file
- **CSS files**: Max 100KB per file
- **Total app size**: Max 2MB per app
- **Images**: Max 500KB per image (before optimization)

Builds will warn if these budgets are exceeded.

## Troubleshooting

### Images Not Loading

- Check file paths are correct
- Verify format support in target browsers
- Ensure fallback formats exist

### Fonts Not Loading

- Verify font files exist
- Check `@font-face` declarations
- Ensure CORS headers are set correctly

### Large Bundle Sizes

- Run `npm run build:analyze` to identify large assets
- Optimize images and fonts
- Consider code splitting for large assets

## Additional Resources

- [Web.dev Image Optimization](https://web.dev/fast/#optimize-your-images)
- [MDN Responsive Images](https://developer.mozilla.org/en-US/docs/Learn/HTML/Multimedia_and_embedding/Responsive_images)
- [Font Loading Best Practices](https://web.dev/font-best-practices/)

---

**Last Updated:** 2024-12-19  
**Maintained By:** Warmthly Development Team

