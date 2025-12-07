/**
 * Warmthly Social Share Component
 * Privacy-first social sharing buttons
 * No tracking, no analytics, just native sharing
 * 
 * Usage:
 * <warmthly-social-share></warmthly-social-share>
 * or
 * <warmthly-social-share title="Custom Title" text="Custom text"></warmthly-social-share>
 */

class WarmthlySocialShare extends HTMLElement {
  connectedCallback(): void {
    const title = this.getAttribute('title') || document.title || 'Warmthly';
    const text = this.getAttribute('text') || document.querySelector('meta[name="description"]')?.getAttribute('content') || 'Rehumanize our world - making empathy a measurable part of our systems';
    const url = this.getAttribute('url') || window.location.href;

    this.render(title, text, url);
  }

  private render(title: string, text: string, url: string): void {
    // Create container
    const container = document.createElement('div');
    container.className = 'social-share';
    container.setAttribute('role', 'group');
    container.setAttribute('aria-label', 'Share this page');

    // Native Web Share API (mobile/desktop)
    if (navigator.share) {
      const nativeButton = this.createButton(
        'Share',
        '🌐',
        () => this.shareNative(title, text, url),
        'Use your device\'s native sharing options'
      );
      container.appendChild(nativeButton);
    }

    // Copy link button (always available)
    const copyButton = this.createButton(
      'Copy Link',
      '📋',
      () => this.copyLink(url),
      'Copy page URL to clipboard'
    );
    container.appendChild(copyButton);

    // Email share
    const emailButton = this.createButton(
      'Email',
      '✉️',
      () => this.shareEmail(title, text, url),
      'Share via email'
    );
    container.appendChild(emailButton);

    // Fallback: Direct share links (no tracking)
    if (!navigator.share) {
      // Twitter/X (no tracking parameters)
      const twitterButton = this.createButton(
        'Twitter',
        '🐦',
        () => this.shareTwitter(title, text, url),
        'Share on Twitter/X'
      );
      container.appendChild(twitterButton);

      // Facebook (no tracking parameters)
      const facebookButton = this.createButton(
        'Facebook',
        '📘',
        () => this.shareFacebook(url),
        'Share on Facebook'
      );
      container.appendChild(facebookButton);

      // LinkedIn (no tracking parameters)
      const linkedinButton = this.createButton(
        'LinkedIn',
        '💼',
        () => this.shareLinkedIn(title, text, url),
        'Share on LinkedIn'
      );
      container.appendChild(linkedinButton);
    }

    // Add styles
    if (!document.querySelector('#warmthly-social-share-styles')) {
      const style = document.createElement('style');
      style.id = 'warmthly-social-share-styles';
      style.textContent = `
        .social-share {
          display: flex;
          flex-wrap: wrap;
          gap: 0.75rem;
          margin: 2rem 0;
          padding: 1rem 0;
          border-top: 1px solid rgba(0, 0, 0, 0.1);
        }
        .social-share-button {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem 1.25rem;
          background: var(--warmthly-background, #fff6f1);
          border: 2px solid var(--warmthly-orange, #FF8C42);
          border-radius: var(--radius-md, 8px);
          color: var(--warmthly-orange, #FF8C42);
          text-decoration: none;
          font-weight: 600;
          font-size: 0.875rem;
          cursor: pointer;
          transition: all 0.2s ease;
          min-width: 24px;
          min-height: 24px;
        }
        .social-share-button:hover,
        .social-share-button:focus {
          background: var(--warmthly-orange, #FF8C42);
          color: white;
          outline: none;
        }
        .social-share-button:active {
          transform: scale(0.98);
        }
        .social-share-icon {
          font-size: 1.25rem;
          line-height: 1;
        }
      `;
      document.head.appendChild(style);
    }

    this.appendChild(container);
  }

  private createButton(
    label: string,
    icon: string,
    onClick: () => void,
    ariaLabel: string
  ): HTMLButtonElement {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'social-share-button';
    button.setAttribute('aria-label', ariaLabel);
    
    const iconSpan = document.createElement('span');
    iconSpan.className = 'social-share-icon';
    iconSpan.setAttribute('aria-hidden', 'true');
    iconSpan.textContent = icon;
    
    const labelSpan = document.createElement('span');
    labelSpan.textContent = label;
    
    button.appendChild(iconSpan);
    button.appendChild(labelSpan);
    button.addEventListener('click', onClick);
    
    return button;
  }

  private async shareNative(title: string, text: string, url: string): Promise<void> {
    try {
      await navigator.share({
        title,
        text,
        url,
      });
    } catch (error) {
      // User cancelled or error - silently fail
      if (import.meta.env?.DEV) {
        console.debug('Share cancelled or failed:', error);
      }
    }
  }

  private async copyLink(url: string): Promise<void> {
    try {
      await navigator.clipboard.writeText(url);
      
      // Show temporary feedback
      const button = event?.target as HTMLElement;
      if (button) {
        const originalText = button.textContent;
        button.textContent = '✓ Copied!';
        setTimeout(() => {
          button.textContent = originalText;
        }, 2000);
      }
    } catch (error) {
      // Fallback for older browsers
      const textarea = document.createElement('textarea');
      textarea.value = url;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      try {
        document.execCommand('copy');
        const button = event?.target as HTMLElement;
        if (button) {
          const originalText = button.textContent;
          button.textContent = '✓ Copied!';
          setTimeout(() => {
            button.textContent = originalText;
          }, 2000);
        }
      } catch {
        // Silently fail
      }
      document.body.removeChild(textarea);
    }
  }

  private shareEmail(title: string, text: string, url: string): void {
    const subject = encodeURIComponent(`Check out: ${title}`);
    const body = encodeURIComponent(`${text}\n\n${url}`);
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  }

  private shareTwitter(title: string, text: string, url: string): void {
    const tweetText = encodeURIComponent(`${title}: ${text}`);
    const tweetUrl = encodeURIComponent(url);
    // No tracking parameters - just clean share
    window.open(`https://twitter.com/intent/tweet?text=${tweetText}&url=${tweetUrl}`, '_blank', 'noopener,noreferrer');
  }

  private shareFacebook(url: string): void {
    const shareUrl = encodeURIComponent(url);
    // No tracking parameters - just clean share
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${shareUrl}`, '_blank', 'noopener,noreferrer');
  }

  private shareLinkedIn(title: string, text: string, url: string): void {
    const shareUrl = encodeURIComponent(url);
    const summary = encodeURIComponent(text);
    const source = encodeURIComponent(title);
    // No tracking parameters - just clean share
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${shareUrl}&summary=${summary}&source=${source}`, '_blank', 'noopener,noreferrer');
  }
}

// Register the custom element
customElements.define('warmthly-social-share', WarmthlySocialShare);

export { WarmthlySocialShare };

