/**
 * Warmthly Content Freshness Component
 * Displays content freshness indicators and version history
 * 
 * Usage:
 * <warmthly-content-freshness 
 *   last-updated="2025-01-15"
 *   version="1.2.0"
 *   show-changelog="true">
 * </warmthly-content-freshness>
 */

interface ChangelogEntry {
  date: string;
  version?: string;
  changes: string[];
}

class WarmthlyContentFreshness extends HTMLElement {
  connectedCallback(): void {
    const lastUpdated = this.getAttribute('last-updated') || '';
    const version = this.getAttribute('version') || '';
    const showChangelog = this.getAttribute('show-changelog') === 'true';
    const changelogData = this.getAttribute('changelog-data');

    this.render(lastUpdated, version, showChangelog, changelogData);
  }

  private render(
    lastUpdated: string,
    version: string,
    showChangelog: boolean,
    changelogData?: string | null
  ): void {
    const container = document.createElement('div');
    container.className = 'content-freshness';
    container.setAttribute('role', 'contentinfo');
    container.setAttribute('aria-label', 'Content freshness information');

    // Last updated indicator
    if (lastUpdated) {
      const freshnessIndicator = this.createFreshnessIndicator(lastUpdated);
      container.appendChild(freshnessIndicator);
    }

    // Version display
    if (version) {
      const versionDisplay = this.createVersionDisplay(version);
      container.appendChild(versionDisplay);
    }

    // Changelog
    if (showChangelog && changelogData) {
      try {
        const changelog = JSON.parse(changelogData) as ChangelogEntry[];
        const changelogSection = this.createChangelog(changelog);
        container.appendChild(changelogSection);
      } catch (error) {
        if (import.meta.env?.DEV) {
          console.warn('Failed to parse changelog data:', error);
        }
      }
    }

    // Add styles
    if (!document.querySelector('#warmthly-content-freshness-styles')) {
      const style = document.createElement('style');
      style.id = 'warmthly-content-freshness-styles';
      style.textContent = `
        .content-freshness {
          margin: 2rem 0;
          padding: 1rem;
          background: var(--warmthly-background, #fff6f1);
          border: 1px solid rgba(255, 140, 66, 0.2);
          border-radius: var(--radius-md, 8px);
          font-size: 0.875rem;
        }
        .freshness-indicator {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-bottom: 0.75rem;
        }
        .freshness-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.25rem;
          padding: 0.25rem 0.5rem;
          background: var(--warmthly-orange, #FF8C42);
          color: white;
          border-radius: 4px;
          font-size: 0.75rem;
          font-weight: 600;
        }
        .freshness-badge.recent {
          background: #4caf50;
        }
        .freshness-badge.stale {
          background: #ff9800;
        }
        .freshness-badge.very-stale {
          background: #f44336;
        }
        .version-display {
          margin-top: 0.5rem;
          color: var(--text-color, #1a1a1a);
          opacity: 0.7;
        }
        .changelog {
          margin-top: 1rem;
          padding-top: 1rem;
          border-top: 1px solid rgba(0, 0, 0, 0.1);
        }
        .changelog-title {
          font-weight: 600;
          margin-bottom: 0.75rem;
          color: var(--warmthly-orange, #FF8C42);
        }
        .changelog-entry {
          margin-bottom: 1rem;
          padding-left: 1rem;
          border-left: 2px solid var(--warmthly-orange, #FF8C42);
        }
        .changelog-date {
          font-weight: 600;
          margin-bottom: 0.25rem;
        }
        .changelog-version {
          display: inline-block;
          margin-left: 0.5rem;
          padding: 0.125rem 0.375rem;
          background: rgba(255, 140, 66, 0.1);
          border-radius: 4px;
          font-size: 0.75rem;
        }
        .changelog-changes {
          list-style: none;
          padding-left: 0;
          margin-top: 0.5rem;
        }
        .changelog-changes li {
          padding-left: 1.5rem;
          position: relative;
          margin-bottom: 0.25rem;
        }
        .changelog-changes li::before {
          content: '•';
          position: absolute;
          left: 0.5rem;
          color: var(--warmthly-orange, #FF8C42);
        }
      `;
      document.head.appendChild(style);
    }

    this.appendChild(container);
  }

  private createFreshnessIndicator(dateString: string): HTMLElement {
    const indicator = document.createElement('div');
    indicator.className = 'freshness-indicator';

    const date = new Date(dateString);
    const now = new Date();
    const daysSinceUpdate = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    let badgeClass = 'recent';
    let badgeText = 'Recent';
    
    if (daysSinceUpdate > 90) {
      badgeClass = 'very-stale';
      badgeText = 'Needs Update';
    } else if (daysSinceUpdate > 30) {
      badgeClass = 'stale';
      badgeText = 'Stale';
    }

    const badge = document.createElement('span');
    badge.className = `freshness-badge ${badgeClass}`;
    badge.textContent = badgeText;
    badge.setAttribute('aria-label', `Content ${badgeText.toLowerCase()}`);

    const text = document.createElement('span');
    text.textContent = `Last updated: ${date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })}`;
    text.setAttribute('aria-label', `Last updated on ${date.toLocaleDateString()}`);

    indicator.appendChild(badge);
    indicator.appendChild(text);

    return indicator;
  }

  private createVersionDisplay(version: string): HTMLElement {
    const display = document.createElement('div');
    display.className = 'version-display';
    display.textContent = `Version ${version}`;
    display.setAttribute('aria-label', `Content version ${version}`);
    return display;
  }

  private createChangelog(entries: ChangelogEntry[]): HTMLElement {
    const changelog = document.createElement('div');
    changelog.className = 'changelog';

    const title = document.createElement('div');
    title.className = 'changelog-title';
    title.textContent = 'Recent Changes';
    changelog.appendChild(title);

    // Show last 5 entries
    entries.slice(0, 5).forEach((entry) => {
      const entryDiv = document.createElement('div');
      entryDiv.className = 'changelog-entry';

      const dateDiv = document.createElement('div');
      dateDiv.className = 'changelog-date';
      const date = new Date(entry.date);
      dateDiv.textContent = date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });

      if (entry.version) {
        const versionSpan = document.createElement('span');
        versionSpan.className = 'changelog-version';
        versionSpan.textContent = `v${entry.version}`;
        dateDiv.appendChild(versionSpan);
      }

      entryDiv.appendChild(dateDiv);

      if (entry.changes && entry.changes.length > 0) {
        const changesList = document.createElement('ul');
        changesList.className = 'changelog-changes';
        entry.changes.forEach((change) => {
          const li = document.createElement('li');
          li.textContent = change;
          changesList.appendChild(li);
        });
        entryDiv.appendChild(changesList);
      }

      changelog.appendChild(entryDiv);
    });

    return changelog;
  }
}

// Register the custom element
customElements.define('warmthly-content-freshness', WarmthlyContentFreshness);

export { WarmthlyContentFreshness };

