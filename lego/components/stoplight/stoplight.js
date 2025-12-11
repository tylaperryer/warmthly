export function initStoplight(stoplightId = 'stoplight', menuId = 'dropdown-menu', options = {}) {
  const stoplight = document.getElementById(stoplightId);
  const dropdownMenu = document.getElementById(menuId);
  const {
    votePanelId,
    voteToggleId,
    voteBarId,
    voteStatusId,
    voteCountId
  } = options;
  
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
    
    if (!isMenuOpen && votePanelId) {
      const panel = document.getElementById(votePanelId);
      const toggle = document.getElementById(voteToggleId);
      if (panel) {
        panel.hidden = true;
      }
      if (toggle) {
        toggle.setAttribute('aria-expanded', 'false');
      }
    }
    
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

  setupVoteUI({
    votePanelId,
    voteToggleId,
    voteBarId,
    voteStatusId,
    voteCountId,
    dropdownMenu
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

const VOTE_STORAGE_KEY = 'warmthly_dissolution_votes';
const USER_VOTE_KEY = 'warmthly_user_vote';
const VOTE_THRESHOLD = 100000;
const THIRTY_DAYS_IN_MILLIS = 30 * 24 * 60 * 60 * 1000;

function getLocalVoteData() {
  try {
    const data = localStorage.getItem(VOTE_STORAGE_KEY);
    if (data) return JSON.parse(data);
  } catch (e) {
    // ignore
  }
  return { yes: 0, no: 0 };
}

function saveLocalVoteData(voteData) {
  try {
    localStorage.setItem(VOTE_STORAGE_KEY, JSON.stringify(voteData));
    return true;
  } catch (e) {
    return false;
  }
}

function getUserVote() {
  try {
    const data = localStorage.getItem(USER_VOTE_KEY);
    if (data) return JSON.parse(data);
  } catch (e) {
    // ignore
  }
  return null;
}

function saveUserVote() {
  try {
    const voteRecord = { timestamp: Date.now() };
    localStorage.setItem(USER_VOTE_KEY, JSON.stringify(voteRecord));
    return true;
  } catch (e) {
    return false;
  }
}

function canUserVote() {
  const userVote = getUserVote();
  if (!userVote) return true;
  const timeSinceVote = Date.now() - userVote.timestamp;
  return timeSinceVote >= THIRTY_DAYS_IN_MILLIS;
}

const FIREBASE_CONFIG = {
  apiKey: 'AIzaSyDexgT1qa34GPGnpmZ1iCvr3jigiwvZ5eE',
  authDomain: 'post-vote-59ed2.firebaseapp.com',
  databaseURL: 'https://post-vote-59ed2-default-rtdb.europe-west1.firebasedatabase.app',
  projectId: 'post-vote-59ed2',
  storageBucket: 'post-vote-59ed2.firebasestorage.app',
  messagingSenderId: '170079221674',
  appId: '1:170079221674:web:58097403f2a85f829b5dd3'
};

let firebaseReadyPromise = null;
async function ensureFirebase() {
  if (window.firebaseDb) return window.firebaseDb;
  if (!firebaseReadyPromise) {
    firebaseReadyPromise = (async () => {
      try {
        const { initializeApp } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js');
        const { getDatabase } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js');
        const app = initializeApp(FIREBASE_CONFIG);
        const db = getDatabase(app);
        window.firebaseApp = app;
        window.firebaseDb = db;
        return db;
      } catch (e) {
        console.warn('Firebase init failed, falling back to local storage.', e);
        return null;
      }
    })();
  }
  return firebaseReadyPromise;
}

async function fetchFirebaseVotes() {
  try {
    const db = await ensureFirebase();
    if (!db) return null;
    const { get, ref } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js');
    const snapshot = await get(ref(db, 'votes/dissolution'));
    if (!snapshot.exists()) return { yes: 0, no: 0 };
    return snapshot.val();
  } catch (e) {
    return null;
  }
}

async function submitFirebaseVote(type) {
  try {
    const db = await ensureFirebase();
    if (!db) return null;
    const { ref, runTransaction } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js');
    const voteRef = ref(db, 'votes/dissolution');
    const result = await runTransaction(voteRef, (currentData) => {
      const data = currentData || { yes: 0, no: 0 };
      const nextValue = Math.max(0, (data[type] || 0) + 1);
      return { yes: data.yes || 0, no: data.no || 0, [type]: nextValue };
    });
    return result?.snapshot?.val() || null;
  } catch (e) {
    return null;
  }
}

function setupVoteUI({ votePanelId, voteToggleId, voteBarId, voteStatusId, voteCountId, dropdownMenu }) {
  if (!votePanelId || !voteToggleId || !voteBarId || !voteStatusId || !voteCountId) {
    return;
  }

  const panel = document.getElementById(votePanelId);
  const toggle = document.getElementById(voteToggleId);
  const bar = document.getElementById(voteBarId);
  const status = document.getElementById(voteStatusId);
  const count = document.getElementById(voteCountId);

  if (!panel || !toggle || !bar || !status || !count) {
    return;
  }

  const voteButtons = panel.querySelectorAll('.stoplight-vote-btn');
  let isSubmitting = false;

  function renderVotes(voteData) {
    const total = (voteData.yes || 0) + (voteData.no || 0);
    const percentage = Math.min((total / VOTE_THRESHOLD) * 100, 100);
    bar.style.width = `${percentage}%`;
    count.textContent = `${total.toLocaleString()} / 100,000`;
    status.textContent = canUserVote() ? 'You can vote once every 30 days.' : 'Thanks. You can vote again in 30 days.';

    voteButtons.forEach(btn => {
      btn.disabled = !canUserVote();
      btn.classList.toggle('blocked', !canUserVote());
    });
  }

  async function loadVotes() {
    const firebaseData = await fetchFirebaseVotes();
    const voteData = firebaseData || getLocalVoteData();
    renderVotes(voteData);
  }

  async function handleVote(type) {
    if (isSubmitting || !canUserVote()) return;
    isSubmitting = true;
    voteButtons.forEach(btn => btn.disabled = true);
    status.textContent = 'Recording vote...';

    try {
      let voteData = await submitFirebaseVote(type);
      if (!voteData) {
        const localData = getLocalVoteData();
        localData[type] = (localData[type] || 0) + 1;
        saveLocalVoteData(localData);
        voteData = localData;
      }
      saveUserVote();
      renderVotes(voteData);
      status.textContent = 'Vote recorded.';
    } catch (error) {
      status.textContent = 'Could not record your vote. Please try again.';
    } finally {
      isSubmitting = false;
      voteButtons.forEach(btn => btn.disabled = !canUserVote());
    }
  }

  toggle.addEventListener('click', (e) => {
    e.stopPropagation();
    panel.hidden = !panel.hidden;
    toggle.setAttribute('aria-expanded', panel.hidden ? 'false' : 'true');
    if (!panel.hidden) {
      loadVotes();
      setTimeout(() => {
        const firstVoteButton = panel.querySelector('.stoplight-vote-btn');
        if (firstVoteButton) firstVoteButton.focus();
      }, 50);
    }
  });

  voteButtons.forEach(btn => {
    btn.addEventListener('click', () => handleVote(btn.dataset.vote));
  });

  dropdownMenu.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !panel.hidden) {
      panel.hidden = true;
      toggle.setAttribute('aria-expanded', 'false');
      toggle.focus();
    }
  });
}

