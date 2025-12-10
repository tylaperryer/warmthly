/**
 * Image Optimization Utilities
 * Provides lazy loading, responsive images, and WebP support
 * Performance Enhancement - Image Optimization
 */

/**
 * Image optimization options
 */
export interface ImageOptimizationOptions {
  readonly src: string;
  readonly alt: string;
  readonly width?: number;
  readonly height?: number;
  readonly loading?: 'lazy' | 'eager';
  readonly fetchpriority?: 'high' | 'low' | 'auto';
  readonly sizes?: string;
  readonly class?: string;
  readonly id?: string;
  readonly isLCP?: boolean; // Is this the Largest Contentful Paint image?
}

/**
 * Responsive image breakpoints
 */
const RESPONSIVE_BREAKPOINTS = [320, 640, 768, 1024, 1280, 1920] as const;

/**
 * Generate WebP URL from original image URL
 */
function getWebPUrl(url: string): string {
  // If already WebP, return as-is
  if (url.endsWith('.webp')) {
    return url;
  }

  // Replace extension with .webp
  return url.replace(/\.(jpg|jpeg|png)$/i, '.webp');
}

/**
 * Generate srcset for responsive images
 */
function generateSrcSet(baseUrl: string, isWebP: boolean = false): string {
  const extension = isWebP ? '.webp' : baseUrl.match(/\.(jpg|jpeg|png|webp)$/i)?.[0] || '.jpg';
  const basePath = baseUrl.replace(/\.(jpg|jpeg|png|webp)$/i, '');

  return RESPONSIVE_BREAKPOINTS.map(width => `${basePath}-${width}w${extension} ${width}w`).join(
    ', '
  );
}

/**
 * Create optimized image element with lazy loading and WebP support
 */
export function createOptimizedImage(options: ImageOptimizationOptions): HTMLImageElement {
  const img = document.createElement('img');

  // Set basic attributes
  img.alt = options.alt;
  img.src = options.src; // Fallback for browsers without WebP support

  // Set dimensions if provided
  if (options.width) {
    img.width = options.width;
  }
  if (options.height) {
    img.height = options.height;
  }

  // Set loading attribute (lazy by default, eager for LCP images)
  img.loading = options.loading || (options.isLCP ? 'eager' : 'lazy');

  // Set fetchpriority (high for LCP, low for below-fold)
  if (options.fetchpriority) {
    img.setAttribute('fetchpriority', options.fetchpriority);
  } else if (options.isLCP) {
    img.setAttribute('fetchpriority', 'high');
  }

  // Add class if provided
  if (options.class) {
    img.className = options.class;
  }

  // Add ID if provided
  if (options.id) {
    img.id = options.id;
  }

  // Generate responsive srcset if sizes provided
  if (options.sizes) {
    img.sizes = options.sizes;

    // Create picture element for WebP with fallback
    const picture = document.createElement('picture');

    // WebP source
    const webpSource = document.createElement('source');
    webpSource.type = 'image/webp';
    webpSource.srcset = generateSrcSet(getWebPUrl(options.src), true);
    webpSource.sizes = options.sizes;
    picture.appendChild(webpSource);

    // Fallback source (original format)
    const fallbackSource = document.createElement('source');
    fallbackSource.srcset = generateSrcSet(options.src, false);
    fallbackSource.sizes = options.sizes;
    picture.appendChild(fallbackSource);

    // Add image to picture
    picture.appendChild(img);

    // Return picture element instead of just img
    return picture as unknown as HTMLImageElement;
  }

  // For non-responsive images, use picture element with WebP
  const picture = document.createElement('picture');

  // WebP source
  const webpSource = document.createElement('source');
  webpSource.type = 'image/webp';
  webpSource.srcset = getWebPUrl(options.src);
  picture.appendChild(webpSource);

  // Fallback image
  picture.appendChild(img);

  return picture as unknown as HTMLImageElement;
}

/**
 * Add lazy loading to existing images
 * Scans page and adds loading="lazy" to images below the fold
 */
export function addLazyLoadingToImages(): void {
  if (typeof document === 'undefined' || typeof IntersectionObserver === 'undefined') {
    return;
  }

  const images = document.querySelectorAll<HTMLImageElement>('img:not([loading])');

  if (images.length === 0) {
    return;
  }

  // Use Intersection Observer to detect images in viewport
  const observer = new IntersectionObserver(
    entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target as HTMLImageElement;
          // Image is in viewport, ensure it loads
          if (!img.loading) {
            img.loading = 'lazy';
          }
          observer.unobserve(img);
        }
      });
    },
    {
      rootMargin: '50px', // Start loading 50px before image enters viewport
    }
  );

  images.forEach(img => {
    // Skip if already has loading attribute
    if (img.hasAttribute('loading')) {
      return;
    }

    // Skip if image is likely above the fold (first few images)
    const rect = img.getBoundingClientRect();
    if (rect.top < window.innerHeight * 2) {
      // Likely above fold, load eagerly
      img.loading = 'eager';
      if (!img.hasAttribute('fetchpriority')) {
        img.setAttribute('fetchpriority', 'high');
      }
    } else {
      // Below fold, lazy load
      img.loading = 'lazy';
      if (!img.hasAttribute('fetchpriority')) {
        img.setAttribute('fetchpriority', 'low');
      }
      observer.observe(img);
    }
  });
}

/**
 * Initialize image optimization
 * Adds lazy loading to all images on page load
 */
export function initImageOptimization(): void {
  if (typeof document === 'undefined') {
    return;
  }

  // Add lazy loading when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      addLazyLoadingToImages();
    });
  } else {
    addLazyLoadingToImages();
  }

  // Also handle dynamically added images
  const mutationObserver = new MutationObserver(() => {
    addLazyLoadingToImages();
  });

  mutationObserver.observe(document.body, {
    childList: true,
    subtree: true,
  });
}
