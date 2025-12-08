/**
 * Breadcrumb Component
 * Provides location indicators for navigation
 *
 * WCAG 2.1 AAA Success Criterion 2.4.8 - Location
 */

import { WARMTHLY_CONFIG } from '@config/warmthly-config.js';

export interface BreadcrumbItem {
  label: string;
  url: string;
  current?: boolean;
}

class WarmthlyBreadcrumb extends HTMLElement {
  connectedCallback() {
    this.render();
  }

  private render() {
    const items = this.getBreadcrumbItems();

    if (items.length === 0) {
      return;
    }

    const nav = document.createElement('nav');
    nav.setAttribute('aria-label', 'Breadcrumb');
    nav.setAttribute('role', 'navigation');

    const ol = document.createElement('ol');
    ol.className = 'breadcrumb-list';
    ol.setAttribute('itemscope', '');
    ol.setAttribute('itemtype', 'https://schema.org/BreadcrumbList');

    items.forEach((item, index) => {
      const li = document.createElement('li');
      li.className = 'breadcrumb-item';
      li.setAttribute('itemprop', 'itemListElement');
      li.setAttribute('itemscope', '');
      li.setAttribute('itemtype', 'https://schema.org/ListItem');

      if (item.current) {
        li.setAttribute('aria-current', 'page');
        const span = document.createElement('span');
        span.setAttribute('itemprop', 'name');
        span.textContent = item.label;
        span.className = 'breadcrumb-current';
        li.appendChild(span);
      } else {
        const a = document.createElement('a');
        a.href = item.url;
        a.setAttribute('itemprop', 'item');
        a.setAttribute('itemprop', 'name');
        a.textContent = item.label;
        a.className = 'breadcrumb-link';
        li.appendChild(a);
      }

      const meta = document.createElement('meta');
      meta.setAttribute('itemprop', 'position');
      meta.setAttribute('content', String(index + 1));
      li.appendChild(meta);

      ol.appendChild(li);

      // Add separator (except for last item)
      if (index < items.length - 1) {
        const separator = document.createElement('span');
        separator.className = 'breadcrumb-separator';
        separator.setAttribute('aria-hidden', 'true');
        separator.textContent = '/';
        ol.appendChild(separator);
      }
    });

    nav.appendChild(ol);
    this.innerHTML = '';
    this.appendChild(nav);
    this.injectStyles();
  }

  private getBreadcrumbItems(): BreadcrumbItem[] {
    const path = window.location.pathname;
    const items: BreadcrumbItem[] = [];

    // Always start with home
    items.push({
      label: 'Home',
      url: WARMTHLY_CONFIG.urls.main,
    });

    // Parse path segments
    const segments = path.split('/').filter(segment => segment && segment !== 'index.html');

    // Map segments to labels
    const segmentLabels: Record<string, string> = {
      main: 'Main',
      post: 'Post',
      mint: 'Mint',
      admin: 'Admin',
      help: 'Help',
      privacy: 'Privacy',
      glossary: 'Glossary',
      'easy-read': 'Easy Read',
      report: 'Report',
      vote: 'Vote',
      'your-data': 'Your Data',
      research: 'Research',
      emails: 'Emails',
    };

    let currentPath = '';
    segments.forEach((segment, index) => {
      currentPath += `/${segment}`;
      const label = segmentLabels[segment] || segment.charAt(0).toUpperCase() + segment.slice(1);
      const isLast = index === segments.length - 1;

      items.push({
        label,
        url: currentPath,
        current: isLast,
      });
    });

    return items;
  }

  private injectStyles() {
    if (document.getElementById('warmthly-breadcrumb-styles')) {
      return;
    }

    const style = document.createElement('style');
    style.id = 'warmthly-breadcrumb-styles';
    style.textContent = `
      .breadcrumb-list {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        list-style: none;
        padding: 0;
        margin: var(--spacing-4) 0;
        gap: var(--spacing-2);
      }
      .breadcrumb-item {
        display: inline-flex;
        align-items: center;
      }
      .breadcrumb-link {
        color: var(--warmthly-orange);
        text-decoration: underline;
        min-width: 44px;
        min-height: 44px;
        display: inline-flex;
        align-items: center;
        padding: 0.25rem 0.5rem;
      }
      .breadcrumb-link:hover,
      .breadcrumb-link:focus {
        background-color: rgba(255, 140, 66, 0.1);
        outline: 2px solid var(--warmthly-orange);
        outline-offset: 2px;
      }
      .breadcrumb-current {
        color: var(--text-color);
        font-weight: 600;
      }
      .breadcrumb-separator {
        color: var(--text-color);
        margin: 0 var(--spacing-1);
        opacity: 0.6;
      }
    `;
    document.head.appendChild(style);
  }
}

customElements.define('warmthly-breadcrumb', WarmthlyBreadcrumb);
