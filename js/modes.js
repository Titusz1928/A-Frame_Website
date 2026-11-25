const SAFE_CRACKED_STORAGE_KEY = 'escape_room_safe_cracked';

export function createModeController({
  sceneEl,
  selectEl,
  panoramaManager,
  welcomeScreenEl,
  sceneSwitcherEl,
  toggleBtnEl,
  playHudEl,
  playInventoryEl,
  exploreEntitiesEl,
  playEntitiesEl,
  chooseExploreBtnEl,
  choosePlayBtnEl,
  backToMenuBtnEl,
  playBackBtnEl,
  exploreModeDescEl,
  onLeavePlay
}) {
  let previousExplorePano = '#pano-1';

  function hasCrackedSafeBefore() {
    try {
      return localStorage.getItem(SAFE_CRACKED_STORAGE_KEY) === 'true';
    } catch (err) {
      console.warn('localStorage read failed:', err);
      return false;
    }
  }

  function markSafeCrackedInStorage() {
    try {
      localStorage.setItem(SAFE_CRACKED_STORAGE_KEY, 'true');
    } catch (err) {
      console.warn('localStorage write failed:', err);
    }
    syncExploreButtonState();
  }

  function syncExploreButtonState() {
    const unlocked = hasCrackedSafeBefore();
    if (!chooseExploreBtnEl) return;

    chooseExploreBtnEl.disabled = !unlocked;
    chooseExploreBtnEl.classList.toggle('is-locked', !unlocked);
    chooseExploreBtnEl.setAttribute('aria-disabled', String(!unlocked));

    if (exploreModeDescEl) {
      exploreModeDescEl.textContent = unlocked
        ? 'Panorama switcher, upload & free look'
        : 'Locked — crack the safe in Play Mode first';
    }
  }

  async function setMode(mode) {
    if (mode === 'explore' && !hasCrackedSafeBefore()) {
      syncExploreButtonState();
      return;
    }

    if (mode === 'menu') {
      syncExploreButtonState();
    }

    const prevMode = document.body.getAttribute('data-mode');
    document.body.setAttribute('data-mode', mode);

    const isMenu = mode === 'menu';
    const isExplore = mode === 'explore';
    const isPlay = mode === 'play';

    if (welcomeScreenEl) welcomeScreenEl.style.display = isMenu ? 'flex' : 'none';
    if (sceneSwitcherEl) sceneSwitcherEl.style.display = isExplore ? 'flex' : 'none';
    if (playHudEl) playHudEl.style.display = isPlay ? 'flex' : 'none';
    if (playInventoryEl) playInventoryEl.style.display = isPlay ? 'flex' : 'none';

    if (exploreEntitiesEl) exploreEntitiesEl.setAttribute('visible', String(isExplore));
    if (playEntitiesEl) playEntitiesEl.setAttribute('visible', String(isPlay));

    if (isPlay) {
      const cursorEl = sceneEl?.querySelector('a-cursor');
      sceneEl?.components?.raycaster?.refreshObjects();
      cursorEl?.components?.raycaster?.refreshObjects();
    }

    if (!isPlay) {
      onLeavePlay?.();
    }

    if (isPlay && prevMode !== 'play') {
      previousExplorePano = selectEl?.value || '#pano-1';
      if (document.getElementById('pano-play')) {
        await panoramaManager?.applyPanorama('#pano-play');
      }
    } else if (!isPlay && prevMode === 'play') {
      await panoramaManager?.applyPanorama(previousExplorePano);
    }
  }

  function init() {
    syncExploreButtonState();

    chooseExploreBtnEl?.addEventListener('click', () => setMode('explore'));
    choosePlayBtnEl?.addEventListener('click', () => setMode('play'));
    backToMenuBtnEl?.addEventListener('click', () => setMode('menu'));
    playBackBtnEl?.addEventListener('click', () => setMode('menu'));

    toggleBtnEl?.addEventListener('click', () => {
      if (!sceneSwitcherEl || !toggleBtnEl) return;
      const collapsed = sceneSwitcherEl.classList.toggle('is-collapsed');
      toggleBtnEl.textContent = collapsed ? '▼' : '▲';
      toggleBtnEl.setAttribute('aria-expanded', String(!collapsed));
    });
  }

  return {
    init,
    setMode,
    hasCrackedSafeBefore,
    markSafeCrackedInStorage,
    syncExploreButtonState
  };
}