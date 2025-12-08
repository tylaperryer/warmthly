const PAGES_TO_PREFETCH: readonly string[] = [
  '/post/index.html',
  '/mint/index.html',
  '/post/vote.html',
  '/mint/research.html',
] as const;

const PREFETCH_DELAY_AFTER_FONTS = 1000;
const PREFETCH_DELAY_FALLBACK = 2000;

function prefetchPage(page: string): void {
  if (typeof document === 'undefined' || typeof document.head === 'undefined') {
    return;
  }

  try {
    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = page;
    link.as = 'document';

    document.head.appendChild(link);
  } catch (error: unknown) {
    if (import.meta.env.DEV) {
      console.warn(`Failed to prefetch ${page}:`, error);
    }
  }
}

function prefetchPages(): void {
  PAGES_TO_PREFETCH.forEach(page => {
    prefetchPage(page);
  });
}

export function initLinkPrefetch(): void {
  if (typeof document === 'undefined' || typeof window === 'undefined') {
    return;
  }

  const schedulePrefetch = (): void => {
    if (document.fonts?.ready) {
      document.fonts.ready
        .then(() => {
          setTimeout(prefetchPages, PREFETCH_DELAY_AFTER_FONTS);
        })
        .catch(() => {
          setTimeout(prefetchPages, PREFETCH_DELAY_FALLBACK);
        });
    } else {
      setTimeout(prefetchPages, PREFETCH_DELAY_FALLBACK);
    }
  };

  schedulePrefetch();

  document.addEventListener(
    'mouseover',
    (e: MouseEvent) => {
      const target = e.target;
      if (!(target instanceof HTMLElement)) {
        return;
      }

      const link = target.closest<HTMLAnchorElement>('a[href]');

      if (!link || !link.href) {
        return;
      }

      try {
        const linkUrl = new URL(link.href, window.location.origin);

        if (linkUrl.origin !== window.location.origin) {
          return;
        }

        const pathname = linkUrl.pathname;
        if (pathname.endsWith('.html') || !pathname.includes('.')) {
          prefetchPage(link.href);
        }
      } catch (error: unknown) {
        if (import.meta.env.DEV) {
          console.warn('Invalid link URL for prefetching:', link.href, error);
        }
      }
    },
    { passive: true }
  );
}
