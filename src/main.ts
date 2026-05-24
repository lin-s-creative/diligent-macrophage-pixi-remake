import './styles.css';
import { GameApp } from './game/GameApp';
import { BrowserRecordsStore } from './storage/BrowserRecordsStore';

const shell = document.getElementById('game-shell');

if (!shell) {
  throw new Error('Game shell element was not found.');
}

const app = new GameApp(shell, new BrowserRecordsStore());
void app.start();
