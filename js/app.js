import { createInventoryManager } from './inventory.js';
import { createVictoryCelebration } from './celebration.js';
import { createPanoramaManager } from './panoramas.js';
import { createPuzzleController } from './puzzle.js';
import { createModeController } from './modes.js';

const scene = document.querySelector('#vr-scene');
const select = document.querySelector('#pano-select');
const assets = document.querySelector('#assets-container');
const reloadBtn = document.querySelector('#reload-wiki-btn');
const statusMsg = document.querySelector('#status-msg');
const uploadInput = document.querySelector('#pano-upload');

const sceneSwitcher = document.querySelector('#scene-switcher');
const toggleBtn = document.querySelector('#toggle-switcher-btn');
const welcomeScreen = document.querySelector('#welcome-screen');
const playHud = document.querySelector('#play-hud');
const playInventory = document.querySelector('#play-inventory');
const inventoryList = document.querySelector('#inventory-list');

const chooseExploreBtn = document.querySelector('#choose-explore-btn');
const choosePlayBtn = document.querySelector('#choose-play-btn');
const backToMenuBtn = document.querySelector('#back-to-menu-btn');
const playBackBtn = document.querySelector('#play-back-btn');
const exploreModeDesc = document.querySelector('#explore-mode-desc');

const exploreEntities = document.querySelector('#explore-entities');
const playEntities = document.querySelector('#play-entities');

const tvRemote = document.querySelector('#tv-remote');
const noteEntity = document.querySelector('#room-note');
const wallSafe = document.querySelector('#wall-safe');
const playSignText = document.querySelector('#play-sign-text');

const playObjective = document.querySelector('#play-objective');
const openKeypadBtn = document.querySelector('#open-keypad-btn');
const closeKeypadBtn = document.querySelector('#close-keypad-btn');
const keypadModal = document.querySelector('#keypad-modal');
const keypadDisplay = document.querySelector('#keypad-display');
const keypadFeedback = document.querySelector('#keypad-feedback');
const keypadHint = document.querySelector('.keypad-hint');
const clearKeyBtn = document.querySelector('#key-clear');
const submitKeyBtn = document.querySelector('#key-submit');
const digitButtons = document.querySelectorAll('.key-btn[data-digit]');

const victoryCelebration = createVictoryCelebration({ sceneEl: scene });
const panoramaManager = createPanoramaManager({
  sceneEl: scene,
  assetsEl: assets,
  selectEl: select,
  uploadInputEl: uploadInput,
  reloadBtnEl: reloadBtn,
  statusMsgEl: statusMsg
});

let puzzleController = null;
let modeController = null;

const inventoryManager = createInventoryManager({
  listEl: inventoryList,
  onSelectionChange(selectedItem) {
    puzzleController?.handleSelectionChange(selectedItem);
  }
});

puzzleController = createPuzzleController({
  sceneEl: scene,
  inventoryManager,
  victoryCelebration,
  playObjectiveEl: playObjective,
  playSignTextEl: playSignText,
  tvRemoteEl: tvRemote,
  noteEntityEl: noteEntity,
  wallSafeEl: wallSafe,
  openKeypadBtnEl: openKeypadBtn,
  closeKeypadBtnEl: closeKeypadBtn,
  keypadModalEl: keypadModal,
  keypadDisplayEl: keypadDisplay,
  keypadFeedbackEl: keypadFeedback,
  keypadHintEl: keypadHint,
  clearKeyBtnEl: clearKeyBtn,
  submitKeyBtnEl: submitKeyBtn,
  digitButtons,
  onSafeUnlocked: () => modeController?.markSafeCrackedInStorage()
});

modeController = createModeController({
  sceneEl: scene,
  selectEl: select,
  panoramaManager,
  welcomeScreenEl: welcomeScreen,
  sceneSwitcherEl: sceneSwitcher,
  toggleBtnEl: toggleBtn,
  playHudEl: playHud,
  playInventoryEl: playInventory,
  exploreEntitiesEl: exploreEntities,
  playEntitiesEl: playEntities,
  chooseExploreBtnEl: chooseExploreBtn,
  choosePlayBtnEl: choosePlayBtn,
  backToMenuBtnEl: backToMenuBtn,
  playBackBtnEl: playBackBtn,
  exploreModeDescEl: exploreModeDesc,
  onLeavePlay: () => puzzleController?.closeKeypad()
});

modeController.init();
puzzleController.init();
panoramaManager.init();
modeController.setMode('menu');