export function initStoplight(stoplightId = 'stoplight', menuId = 'dropdown-menu') {
  const stoplight = document.getElementById(stoplightId);
  const dropdownMenu = document.getElementById(menuId);
  
  if (!stoplight || !dropdownMenu) {
    return;
  }
  
  let isMenuOpen = false;
  
  let focusTrapCleanup = null;
  
  function toggleMenu() {
    isMenuOpen = !isMenuOpen;
    stoplight.classList.toggle('active', isMenuOpen);
    dropdownMenu.classList.toggle('active', isMenuOpen);
    stoplight.setAttribute('aria-expanded', isMenuOpen ? 'true' : 'false');
    stoplight.setAttribute('aria-pressed', isMenuOpen ? 'true' : 'false');
    
    const menuItems = dropdownMenu.querySelectorAll('a[role="menuitem"], button[role="menuitem"]');
    menuItems.forEach(item => {
      item.setAttribute('tabindex', isMenuOpen ? '0' : '-1');
    });
    
    if (isMenuOpen) {
      const firstItem = dropdownMenu.querySelector('a[role="menuitem"], button[role="menuitem"]');
      if (firstItem) {
        setTimeout(() => firstItem.focus(), 100);
      }
      
      if (typeof window.trapFocus === 'function') {
        focusTrapCleanup = window.trapFocus(dropdownMenu);
      }
    } else {
      if (focusTrapCleanup) {
        focusTrapCleanup();
        focusTrapCleanup = null;
      }
    }
  }
  
  if (stoplight.tagName !== 'BUTTON') {
    stoplight.setAttribute('role', 'button');
  }
  stoplight.setAttribute('tabindex', '0');
  stoplight.setAttribute('aria-label', 'Open navigation menu');
  stoplight.setAttribute('aria-expanded', 'false');
  stoplight.setAttribute('aria-pressed', 'false');
  stoplight.setAttribute('aria-haspopup', 'true');
  stoplight.setAttribute('aria-controls', menuId);
  stoplight.setAttribute('type', 'button');
  
  dropdownMenu.setAttribute('role', 'menu');
  
  const menuItems = dropdownMenu.querySelectorAll('a, button');
  menuItems.forEach((item) => {
    if (item.tagName === 'A' && !item.hasAttribute('role')) {
      item.setAttribute('role', 'menuitem');
      item.setAttribute('tabindex', isMenuOpen ? '0' : '-1');
    }
  });
  
  stoplight.addEventListener('click', (e) => {
    e.stopPropagation();
    e.preventDefault();
    toggleMenu();
  });
  
  stoplight.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      toggleMenu();
    } else if (e.key === 'ArrowDown' && !isMenuOpen) {
      e.preventDefault();
      toggleMenu();
    } else if (e.key === 'Escape' && isMenuOpen) {
      e.preventDefault();
      toggleMenu();
      stoplight.focus();
    }
  });
  
  dropdownMenu.addEventListener('keydown', (e) => {
    const menuItems = Array.from(dropdownMenu.querySelectorAll('a[role="menuitem"], button[role="menuitem"]'));
    const currentIndex = menuItems.indexOf(e.target);
    
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        const nextIndex = (currentIndex + 1) % menuItems.length;
        menuItems[nextIndex].focus();
        break;
      case 'ArrowUp':
        e.preventDefault();
        const prevIndex = currentIndex <= 0 ? menuItems.length - 1 : currentIndex - 1;
        menuItems[prevIndex].focus();
        break;
      case 'Home':
        e.preventDefault();
        if (menuItems.length > 0) {
          menuItems[0].focus();
        }
        break;
      case 'End':
        e.preventDefault();
        if (menuItems.length > 0) {
          menuItems[menuItems.length - 1].focus();
        }
        break;
      case 'Escape':
        e.preventDefault();
        toggleMenu();
        stoplight.focus();
        break;
    }
  });
  
  document.addEventListener('click', (e) => {
    if (!stoplight.contains(e.target) && !dropdownMenu.contains(e.target) && isMenuOpen) {
      toggleMenu();
    }
  });
  
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && isMenuOpen) {
      toggleMenu();
      stoplight.focus();
    }
  });
  
  dropdownMenu.addEventListener('click', (e) => {
    if (e.target.tagName !== 'A') {
      e.stopPropagation();
    }
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    const stoplight = document.getElementById('stoplight');
    if (stoplight) {
      initStoplight();
    }
  });
} else {
  const stoplight = document.getElementById('stoplight');
  if (stoplight) {
    initStoplight();
  }
}

