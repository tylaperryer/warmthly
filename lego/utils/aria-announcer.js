class AriaAnnouncer {
  constructor() {
    this.announcer = null;
    this.init();
  }
  
  init() {
    if (this.announcer) return;
    
    this.announcer = document.createElement('div');
    this.announcer.setAttribute('role', 'status');
    this.announcer.setAttribute('aria-live', 'polite');
    this.announcer.setAttribute('aria-atomic', 'true');
    this.announcer.className = 'sr-only';
    this.announcer.id = 'aria-announcer';
    document.body.appendChild(this.announcer);
  }
  
  announce(message, priority = 'polite') {
    if (!this.announcer) this.init();
    
    if (!message || typeof message !== 'string') return;
    
    this.announcer.setAttribute('aria-live', priority);
    this.announcer.textContent = message;
    
    setTimeout(() => {
      if (this.announcer) {
        this.announcer.textContent = '';
      }
    }, 1000);
  }
}

export const ariaAnnouncer = new AriaAnnouncer();

