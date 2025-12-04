/**
 * Stoplight Menu Component
 * Reusable stoplight navigation menu functionality
 * Usage: Call initStoplight(containerId, menuId) after DOM is loaded
 */

export function initStoplight(stoplightId = 'stoplight', menuId = 'dropdown-menu') {
  const stoplight = document.getElementById(stoplightId);
  const dropdownMenu = document.getElementById(menuId);
  
  if (!stoplight || !dropdownMenu) {
    console.warn(`Stoplight component: Elements with IDs "${stoplightId}" or "${menuId}" not found`);
    return;
  }
  
  let isMenuOpen = false;
  
  function toggleMenu() {
    isMenuOpen = !isMenuOpen;
    stoplight.classList.toggle('active', isMenuOpen);
    dropdownMenu.classList.toggle('active', isMenuOpen);
    stoplight.setAttribute('aria-expanded', isMenuOpen ? 'true' : 'false');
  }
  
  // Add keyboard support for stoplight
  stoplight.setAttribute('role', 'button');
  stoplight.setAttribute('tabindex', '0');
  stoplight.setAttribute('aria-label', 'Open navigation menu');
  stoplight.setAttribute('aria-expanded', 'false');
  stoplight.setAttribute('aria-haspopup', 'true');
  
  stoplight.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleMenu();
  });
  
  stoplight.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
      e.preventDefault();
      toggleMenu();
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
    }
  });
  
  dropdownMenu.addEventListener('click', (e) => {
    e.stopPropagation();
  });
}

// Auto-initialize if stoplight element exists
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

