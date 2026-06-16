import './styles.css';
import * as React from 'react';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { DEFAULT_LEVEL, DEFAULT_UNLOCKED_LEVEL_ID, type LevelConfig, type LevelId } from './config/levels';
import { GameApp, type GameResultData } from './game/GameApp';
import { BrowserRecordsStore } from './storage/BrowserRecordsStore';
import type { RecordsSummary } from './storage/RecordsStore';
import { GameUi, type GameUiActions, type GameUiState, type UiScreen } from './ui/GameUi';

const root = document.getElementById('root');
const shell = document.getElementById('game-shell');

if (!root) {
  throw new Error('Root element was not found.');
}

if (!shell) {
  throw new Error('Game shell element was not found.');
}

const emptyRecords: RecordsSummary = { bestScore: 0, gamesPlayed: 0, records: [] };
const reactRoot = createRoot(root);
let gameApp: GameApp | null = null;

let uiState: GameUiState = {
  screen: 'main',
  recordsSummary: emptyRecords,
  unlockedLevelId: DEFAULT_UNLOCKED_LEVEL_ID,
  selectedLevel: DEFAULT_LEVEL,
  result: null
};

const setUiState = (patch: Partial<GameUiState>): void => {
  uiState = { ...uiState, ...patch };
  renderUi();
};

const showScreen = (screen: UiScreen, extraState: Partial<GameUiState> = {}): void => {
  setUiState({ screen, ...extraState });
};

const startLevel = (level: LevelConfig): void => {
  gameApp?.startGame(level);
};

const actions: GameUiActions = {
  showMainMenu: () => {
    gameApp?.requestMainMenu();
    showScreen('main', { result: null });
  },
  showLevelSelect: () => {
    gameApp?.leaveGameplay();
    showScreen('levels', { result: null });
  },
  showControls: () => showScreen('controls'),
  showDesigner: () => {
    gameApp?.leaveGameplay();
    showScreen('designer', { result: null });
  },
  startLevel: (level) => startLevel(level),
  restartLevel: (level) => startLevel(level)
};

function renderUi(): void {
  reactRoot.render(
    <StrictMode>
      <GameUi state={uiState} actions={actions} />
    </StrictMode>
  );
}

renderUi();

gameApp = new GameApp(shell, new BrowserRecordsStore(), {
  onGameStarted: (level) => {
    setUiState({ screen: 'game', selectedLevel: level, result: null });
  },
  onMenuRequested: () => {
    setUiState({ screen: 'main', result: null });
  },
  onProgressChanged: (unlockedLevelId: LevelId) => {
    setUiState({ unlockedLevelId });
  },
  onRecordsChanged: (recordsSummary) => {
    setUiState({ recordsSummary });
  },
  onResult: (result: GameResultData) => {
    setUiState({
      screen: 'result',
      result,
      selectedLevel: result.level,
      unlockedLevelId: gameApp?.getSnapshot().unlockedLevelId ?? uiState.unlockedLevelId
    });
  }
});

void gameApp.start().then((snapshot) => {
  setUiState({
    recordsSummary: snapshot.recordsSummary,
    unlockedLevelId: snapshot.unlockedLevelId,
    selectedLevel: snapshot.selectedLevel
  });
});

window.addEventListener('beforeunload', () => {
  gameApp?.destroy();
});
