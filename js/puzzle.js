const SECRET_CODE = '4289';
const TV_CHANNELS = [
  { src: null, label: 'TV is off' },
  { src: '#chan-1', label: 'Channel 1 ' },
  { src: '#chan-2', label: 'Channel 2 ' },
  { src: '#chan-3', label: 'Channel 3 ' }
];
const TV_SCREEN_WIDTH = 1.38;
const TV_SCREEN_HEIGHT = 0.8;

export function createPuzzleController({
  sceneEl,
  inventoryManager,
  victoryCelebration,
  playObjectiveEl,
  playSignTextEl,
  tvRemoteEl,
  noteEntityEl,
  wallSafeEl,
  openKeypadBtnEl,
  closeKeypadBtnEl,
  keypadModalEl,
  keypadDisplayEl,
  keypadFeedbackEl,
  keypadHintEl,
  clearKeyBtnEl,
  submitKeyBtnEl,
  digitButtons,
  onSafeUnlocked
}) {
  let enteredCode = '';
  let puzzleUnlocked = false;
  let tvChannelIndex = 0;

  function isPlayMode() {
    return document.body.getAttribute('data-mode') === 'play';
  }

  function refreshRaycasters() {
    const cursorEl = sceneEl?.querySelector('a-cursor');
    sceneEl?.components?.raycaster?.refreshObjects();
    cursorEl?.components?.raycaster?.refreshObjects();
  }

  function isUnlocked() {
    return puzzleUnlocked;
  }

  function handleSelectionChange(selectedItem) {
    if (puzzleUnlocked || !playObjectiveEl) return;

    if (!selectedItem) {
      playObjectiveEl.textContent = 'Objective: Inspect items in the room & unlock the safe';
      return;
    }

    if (selectedItem.id === 'note') {
      playObjectiveEl.textContent = `Note: ${selectedItem.clueText}`;
    } else if (selectedItem.id === 'tv-remote') {
      playObjectiveEl.textContent = 'TV Remote selected — click the TV to cycle channels';
    } else {
      playObjectiveEl.textContent = `Selected: ${selectedItem.label}`;
    }
  }

  /* TV CHANNEL CYCLING */
  function renderTvChannel() {
    const channelSelectors = [null, '#tv-chan-1', '#tv-chan-2', '#tv-chan-3'];

    channelSelectors.forEach((selector, idx) => {
      if (!selector) return;
      const plane = document.querySelector(selector);
      if (!plane) return;
      const isActive = idx === tvChannelIndex;
      plane.setAttribute('visible', String(isActive));
      plane.setAttribute('width', String(TV_SCREEN_WIDTH));
      plane.setAttribute('height', String(TV_SCREEN_HEIGHT));
      if (plane.object3D) {
        plane.object3D.visible = isActive;
      }
    });
  }

  function handleTvClick() {
    if (!isPlayMode()) return;

    const selected = inventoryManager.getSelectedItem();
    if (!selected || selected.id !== 'tv-remote') {
      if (!puzzleUnlocked && playObjectiveEl) {
        playObjectiveEl.textContent = inventoryManager.hasItem('tv-remote')
          ? 'Select the TV Remote in your inventory first to use the TV.'
          : 'The TV needs a remote — look around the room.';
      }
      return;
    }

    tvChannelIndex = (tvChannelIndex + 1) % TV_CHANNELS.length;
    renderTvChannel();

    if (!puzzleUnlocked && playObjectiveEl) {
      playObjectiveEl.textContent = `${TV_CHANNELS[tvChannelIndex].label} (click TV again to cycle)`;
    }
  }

  /* KEYPAD MODAL */
  function renderKeypadDisplay() {
    if (!keypadDisplayEl) return;
    keypadDisplayEl.textContent = enteredCode.padEnd(4, '-');
  }

  function openKeypad() {
    if (!isPlayMode() || !keypadModalEl) return;
    const hasNote = inventoryManager.hasItem('note');
    if (keypadHintEl) {
      keypadHintEl.textContent = hasNote
        ? 'Note clue: The last digit is 9.'
        : 'Enter the 4-digit code to unlock the safe.';
    }
    if (keypadFeedbackEl) {
      keypadFeedbackEl.textContent = puzzleUnlocked
        ? 'Safe unlocked! Congratulations.'
        : '';
      keypadFeedbackEl.classList.toggle('success', puzzleUnlocked);
    }
    renderKeypadDisplay();
    keypadModalEl.classList.remove('hidden');
    keypadModalEl.style.display = 'flex';
  }

  function closeKeypad() {
    if (!keypadModalEl) return;
    keypadModalEl.classList.add('hidden');
    keypadModalEl.style.display = 'none';
  }

  function handleDigitClick(digit) {
    if (puzzleUnlocked || enteredCode.length >= 4) return;
    enteredCode += digit;
    if (keypadFeedbackEl) {
      keypadFeedbackEl.textContent = '';
      keypadFeedbackEl.classList.remove('success');
    }
    renderKeypadDisplay();
  }

  function handleClearClick() {
    if (puzzleUnlocked) return;
    enteredCode = '';
    if (keypadFeedbackEl) {
      keypadFeedbackEl.textContent = '';
      keypadFeedbackEl.classList.remove('success');
    }
    renderKeypadDisplay();
  }

  function handleSubmitClick() {
    if (enteredCode === SECRET_CODE) {
      puzzleUnlocked = true;
      onSafeUnlocked?.();
      if (keypadFeedbackEl) {
        keypadFeedbackEl.textContent = 'ACCESS GRANTED! Safe unlocked.';
        keypadFeedbackEl.classList.add('success');
      }
      if (playObjectiveEl) {
        playObjectiveEl.textContent = 'Congratulations! You unlocked the safe.';
      }
      if (playSignTextEl) {
        playSignTextEl.setAttribute('value', 'SAFE UNLOCKED!\nWell done — you cracked the code.');
        playSignTextEl.setAttribute('color', '#FFD166');
      }
      victoryCelebration?.trigger();
      setTimeout(() => {
        closeKeypad();
      }, 900);
    } else {
      if (keypadFeedbackEl) {
        keypadFeedbackEl.textContent = 'Incorrect code. Check your clues!';
        keypadFeedbackEl.classList.remove('success');
      }
      enteredCode = '';
      renderKeypadDisplay();
    }
  }

  function init() {
    renderTvChannel();

    openKeypadBtnEl?.addEventListener('click', openKeypad);
    closeKeypadBtnEl?.addEventListener('click', closeKeypad);

    tvRemoteEl?.addEventListener('click', () => {
      if (!isPlayMode()) return;
      tvRemoteEl.setAttribute('visible', 'false');
      tvRemoteEl.classList.remove('clickable');
      refreshRaycasters();
      inventoryManager.addItem({
        id: 'tv-remote',
        label: 'TV Remote',
        iconSrc: 'tvremote.png'
      });
    });

    noteEntityEl?.addEventListener('click', () => {
      if (!isPlayMode()) return;
      noteEntityEl.setAttribute('visible', 'false');
      noteEntityEl.classList.remove('clickable');
      refreshRaycasters();
      inventoryManager.addItem({
        id: 'note',
        label: 'Note',
        iconSrc: 'note.png',
        clueText: 'The last digit is 9'
      });
    });

    ['#tv-frame', '#tv-chan-1', '#tv-chan-2', '#tv-chan-3'].forEach((selector) => {
      const el = document.querySelector(selector);
      el?.addEventListener('click', handleTvClick);
    });

    wallSafeEl?.addEventListener('click', () => {
      if (!isPlayMode()) return;
      openKeypad();
    });

    digitButtons?.forEach((btn) => {
      btn.addEventListener('click', () => handleDigitClick(btn.dataset.digit));
    });

    clearKeyBtnEl?.addEventListener('click', handleClearClick);
    submitKeyBtnEl?.addEventListener('click', handleSubmitClick);
  }

  return {
    init,
    isUnlocked,
    handleSelectionChange,
    closeKeypad
  };
}