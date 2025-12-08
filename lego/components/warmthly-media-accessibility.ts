/**
 * Multimedia Accessibility Component
 * Provides sign language videos, audio descriptions, and comprehensive transcripts
 *
 * WCAG 2.1 AAA Success Criteria:
 * - 1.2.6 Sign Language (Prerecorded) - Level AAA
 * - 1.2.7 Extended Audio Description (Prerecorded) - Level AAA
 * - 1.2.8 Media Alternative (Prerecorded) - Level AAA
 */

export interface MediaAccessibilityOptions {
  videoId?: string;
  audioId?: string;
  signLanguageVideoUrl?: string;
  audioDescriptionUrl?: string;
  transcriptUrl?: string;
  transcriptText?: string;
  captionsUrl?: string;
  chaptersUrl?: string;
}

class WarmthlyMediaAccessibility extends HTMLElement {
  private options: MediaAccessibilityOptions = {};

  connectedCallback() {
    this.parseAttributes();
    this.render();
  }

  private parseAttributes() {
    this.options = {
      videoId: this.getAttribute('video-id') || undefined,
      audioId: this.getAttribute('audio-id') || undefined,
      signLanguageVideoUrl: this.getAttribute('sign-language-url') || undefined,
      audioDescriptionUrl: this.getAttribute('audio-description-url') || undefined,
      transcriptUrl: this.getAttribute('transcript-url') || undefined,
      transcriptText: this.getAttribute('transcript-text') || undefined,
      captionsUrl: this.getAttribute('captions-url') || undefined,
      chaptersUrl: this.getAttribute('chapters-url') || undefined,
    };
  }

  private render() {
    const hasOptions = Object.values(this.options).some(v => v !== undefined);

    if (!hasOptions) {
      console.warn('WarmthlyMediaAccessibility: No accessibility options provided');
      return;
    }

    const container = document.createElement('div');
    container.className = 'media-accessibility-container';
    container.setAttribute('role', 'region');
    container.setAttribute('aria-label', 'Media accessibility options');

    // Sign Language Video
    if (this.options.signLanguageVideoUrl) {
      container.appendChild(this.createSignLanguageSection());
    }

    // Audio Description
    if (this.options.audioDescriptionUrl) {
      container.appendChild(this.createAudioDescriptionSection());
    }

    // Transcript
    if (this.options.transcriptUrl || this.options.transcriptText) {
      container.appendChild(this.createTranscriptSection());
    }

    // Captions Toggle (if video exists)
    if (this.options.videoId) {
      container.appendChild(this.createCaptionsToggle());
    }

    this.innerHTML = '';
    this.appendChild(container);
    this.injectStyles();
  }

  private createSignLanguageSection(): HTMLElement {
    const section = document.createElement('section');
    section.className = 'media-accessibility-section sign-language';
    section.setAttribute('aria-labelledby', 'sign-language-heading');

    const heading = document.createElement('h3');
    heading.id = 'sign-language-heading';
    heading.className = 'media-accessibility-heading';
    heading.textContent = 'Sign Language Video';
    heading.setAttribute('aria-label', 'Sign language interpretation available');

    const video = document.createElement('video');
    video.className = 'sign-language-video';
    video.src = this.options.signLanguageVideoUrl!;
    video.setAttribute('controls', '');
    video.setAttribute('aria-label', 'Sign language interpretation of the content');
    video.setAttribute('preload', 'metadata');

    // Add poster image if available
    const poster = this.getAttribute('sign-language-poster');
    if (poster) {
      video.setAttribute('poster', poster);
    }

    const description = document.createElement('p');
    description.className = 'media-accessibility-description';
    description.textContent = 'This video provides sign language interpretation of the content.';

    section.appendChild(heading);
    section.appendChild(description);
    section.appendChild(video);

    return section;
  }

  private createAudioDescriptionSection(): HTMLElement {
    const section = document.createElement('section');
    section.className = 'media-accessibility-section audio-description';
    section.setAttribute('aria-labelledby', 'audio-description-heading');

    const heading = document.createElement('h3');
    heading.id = 'audio-description-heading';
    heading.className = 'media-accessibility-heading';
    heading.textContent = 'Audio Description';
    heading.setAttribute('aria-label', 'Extended audio description available');

    const audio = document.createElement('audio');
    audio.className = 'audio-description-track';
    audio.src = this.options.audioDescriptionUrl!;
    audio.setAttribute('controls', '');
    audio.setAttribute('aria-label', 'Extended audio description with detailed visual information');
    audio.setAttribute('preload', 'metadata');

    const description = document.createElement('p');
    description.className = 'media-accessibility-description';
    description.textContent =
      'This audio track provides extended descriptions of visual content not described in the main audio.';

    const toggleButton = document.createElement('button');
    toggleButton.className = 'audio-description-toggle';
    toggleButton.textContent = 'Play Audio Description';
    toggleButton.setAttribute('aria-label', 'Toggle audio description');
    toggleButton.addEventListener('click', () => {
      this.toggleAudioDescription(audio, toggleButton);
    });

    section.appendChild(heading);
    section.appendChild(description);
    section.appendChild(toggleButton);
    section.appendChild(audio);

    return section;
  }

  private createTranscriptSection(): HTMLElement {
    const section = document.createElement('section');
    section.className = 'media-accessibility-section transcript';
    section.setAttribute('aria-labelledby', 'transcript-heading');

    const heading = document.createElement('h3');
    heading.id = 'transcript-heading';
    heading.className = 'media-accessibility-heading';
    heading.textContent = 'Transcript';
    heading.setAttribute('aria-label', 'Comprehensive transcript available');

    const toggleButton = document.createElement('button');
    toggleButton.className = 'transcript-toggle';
    toggleButton.textContent = 'Show Transcript';
    toggleButton.setAttribute('aria-expanded', 'false');
    toggleButton.setAttribute('aria-controls', 'transcript-content');
    toggleButton.addEventListener('click', () => {
      this.toggleTranscript(toggleButton);
    });

    const transcriptContainer = document.createElement('div');
    transcriptContainer.id = 'transcript-content';
    transcriptContainer.className = 'transcript-content';
    transcriptContainer.setAttribute('aria-labelledby', 'transcript-heading');
    transcriptContainer.setAttribute('hidden', '');

    if (this.options.transcriptText) {
      transcriptContainer.innerHTML = `<div class="transcript-text">${this.options.transcriptText}</div>`;
    } else if (this.options.transcriptUrl) {
      // Load transcript from URL
      fetch(this.options.transcriptUrl)
        .then(response => response.text())
        .then(text => {
          transcriptContainer.innerHTML = `<div class="transcript-text">${text}</div>`;
        })
        .catch(error => {
          console.error('Failed to load transcript:', error);
          transcriptContainer.innerHTML = '<p>Transcript could not be loaded.</p>';
        });
    }

    const downloadButton = document.createElement('a');
    downloadButton.className = 'transcript-download';
    downloadButton.href = this.options.transcriptUrl || '#';
    downloadButton.download = 'transcript.txt';
    downloadButton.textContent = 'Download Transcript';
    downloadButton.setAttribute('aria-label', 'Download transcript as text file');

    section.appendChild(heading);
    section.appendChild(toggleButton);
    section.appendChild(transcriptContainer);
    if (this.options.transcriptUrl) {
      section.appendChild(downloadButton);
    }

    return section;
  }

  private createCaptionsToggle(): HTMLElement {
    const section = document.createElement('section');
    section.className = 'media-accessibility-section captions';
    section.setAttribute('aria-labelledby', 'captions-heading');

    const heading = document.createElement('h3');
    heading.id = 'captions-heading';
    heading.className = 'media-accessibility-heading';
    heading.textContent = 'Captions';
    heading.setAttribute('aria-label', 'Closed captions available');

    const toggleButton = document.createElement('button');
    toggleButton.className = 'captions-toggle';
    toggleButton.textContent = 'Toggle Captions';
    toggleButton.setAttribute('aria-label', 'Toggle closed captions');
    toggleButton.addEventListener('click', () => {
      this.toggleCaptions(toggleButton);
    });

    section.appendChild(heading);
    section.appendChild(toggleButton);

    return section;
  }

  private toggleAudioDescription(audio: HTMLAudioElement, button: HTMLButtonElement) {
    if (audio.paused) {
      audio.play();
      button.textContent = 'Pause Audio Description';
      button.setAttribute('aria-label', 'Pause audio description');
    } else {
      audio.pause();
      button.textContent = 'Play Audio Description';
      button.setAttribute('aria-label', 'Play audio description');
    }
  }

  private toggleTranscript(button: HTMLButtonElement) {
    const transcript = document.getElementById('transcript-content');
    if (!transcript) return;

    const isHidden = transcript.hasAttribute('hidden');

    if (isHidden) {
      transcript.removeAttribute('hidden');
      button.textContent = 'Hide Transcript';
      button.setAttribute('aria-expanded', 'true');
    } else {
      transcript.setAttribute('hidden', '');
      button.textContent = 'Show Transcript';
      button.setAttribute('aria-expanded', 'false');
    }
  }

  private toggleCaptions(button: HTMLButtonElement) {
    const videoId = this.options.videoId;
    if (!videoId) return;

    const video = document.getElementById(videoId) as HTMLVideoElement;
    if (!video) {
      console.warn(`Video element with id "${videoId}" not found`);
      return;
    }

    // Toggle captions track
    if (video.textTracks && video.textTracks.length > 0) {
      const track = video.textTracks[0];
      if (track.mode === 'hidden' || track.mode === 'disabled') {
        track.mode = 'showing';
        button.textContent = 'Hide Captions';
        button.setAttribute('aria-label', 'Hide closed captions');
      } else {
        track.mode = 'hidden';
        button.textContent = 'Show Captions';
        button.setAttribute('aria-label', 'Show closed captions');
      }
    } else if (this.options.captionsUrl) {
      // Add captions track if not present
      const track = document.createElement('track');
      track.kind = 'captions';
      track.label = 'English';
      track.srclang = 'en';
      track.src = this.options.captionsUrl;
      track.default = true;
      video.appendChild(track);

      track.addEventListener('load', () => {
        const textTrack = video.textTracks[video.textTracks.length - 1];
        if (textTrack) {
          textTrack.mode = 'showing';
          button.textContent = 'Hide Captions';
          button.setAttribute('aria-label', 'Hide closed captions');
        }
      });
    }
  }

  private injectStyles() {
    if (document.getElementById('media-accessibility-styles')) return;

    const style = document.createElement('style');
    style.id = 'media-accessibility-styles';
    style.textContent = `
      .media-accessibility-container {
        margin: 2rem 0;
        padding: 1.5rem;
        background: var(--bg-color, #fff);
        border: 2px solid var(--warmthly-orange, #ff6b35);
        border-radius: 0.5rem;
      }
      
      .media-accessibility-section {
        margin-bottom: 2rem;
      }
      
      .media-accessibility-section:last-child {
        margin-bottom: 0;
      }
      
      .media-accessibility-heading {
        font-size: 1.25rem;
        font-weight: 600;
        color: var(--warmthly-orange, #ff6b35);
        margin-bottom: 1rem;
      }
      
      .media-accessibility-description {
        margin-bottom: 1rem;
        color: var(--text-color, #333);
        font-size: 0.9375rem;
      }
      
      .sign-language-video,
      .audio-description-track {
        width: 100%;
        max-width: 600px;
        margin: 1rem 0;
        border-radius: 0.375rem;
      }
      
      .audio-description-toggle,
      .transcript-toggle,
      .captions-toggle {
        padding: 0.75rem 1.5rem;
        background: var(--warmthly-orange, #ff6b35);
        color: white;
        border: none;
        border-radius: 0.375rem;
        cursor: pointer;
        font-size: 1rem;
        font-weight: 600;
        transition: all 0.2s ease;
        margin-bottom: 1rem;
      }
      
      .audio-description-toggle:hover,
      .transcript-toggle:hover,
      .captions-toggle:hover {
        background: var(--warmthly-orange-dark, #e55a2b);
        transform: translateY(-2px);
      }
      
      .audio-description-toggle:focus,
      .transcript-toggle:focus,
      .captions-toggle:focus {
        outline: 3px solid var(--warmthly-orange, #ff6b35);
        outline-offset: 2px;
      }
      
      .transcript-content {
        margin-top: 1rem;
        padding: 1.5rem;
        background: var(--bg-secondary, #f5f5f5);
        border-radius: 0.375rem;
        max-height: 400px;
        overflow-y: auto;
      }
      
      .transcript-text {
        white-space: pre-wrap;
        line-height: 1.8;
        color: var(--text-color, #333);
      }
      
      .transcript-download {
        display: inline-block;
        margin-top: 1rem;
        padding: 0.5rem 1rem;
        background: transparent;
        color: var(--warmthly-orange, #ff6b35);
        border: 2px solid var(--warmthly-orange, #ff6b35);
        border-radius: 0.375rem;
        text-decoration: none;
        transition: all 0.2s ease;
      }
      
      .transcript-download:hover {
        background: var(--warmthly-orange, #ff6b35);
        color: white;
      }
      
      @media (max-width: 640px) {
        .media-accessibility-container {
          padding: 1rem;
        }
        
        .sign-language-video,
        .audio-description-track {
          max-width: 100%;
        }
      }
    `;

    document.head.appendChild(style);
  }
}

customElements.define('warmthly-media-accessibility', WarmthlyMediaAccessibility);
