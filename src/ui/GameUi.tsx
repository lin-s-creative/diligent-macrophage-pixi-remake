import { useCallback, useEffect, useMemo, useState, type CSSProperties } from 'react';
import type { GameResultData } from '../game/GameApp';
import { LEVELS, type LevelConfig, type LevelId } from '../config/levels';
import type { RecordsSummary } from '../storage/RecordsStore';
import { DesignerPage } from './DesignerPage';
import { MainMenuBackground } from './MainMenuBackground';

export type UiScreen = 'main' | 'levels' | 'controls' | 'game' | 'result' | 'designer';

export interface GameUiState {
  screen: UiScreen;
  recordsSummary: RecordsSummary;
  unlockedLevelId: LevelId;
  selectedLevel: LevelConfig;
  result: GameResultData | null;
}

export interface GameUiActions {
  showMainMenu: () => void;
  showLevelSelect: () => void;
  showControls: () => void;
  showDesigner: () => void;
  startLevel: (level: LevelConfig) => void;
  restartLevel: (level: LevelConfig) => void;
}

export interface GameUiProps {
  state: GameUiState;
  actions: GameUiActions;
}

function hexColor(value: number): string {
  return `#${value.toString(16).padStart(6, '0')}`;
}

function MainMenu({ state, actions }: GameUiProps): JSX.Element {
  return (
    <section className="ui-screen ui-main-screen" aria-label="Главное меню">
      <MainMenuBackground />
      <div className="ui-title-block">
        <div className="ui-eyebrow">иммунный скролл-шутер</div>
        <h1>МАКРОФАГ</h1>
        <p>Очисти организм от инфекции и открой новые ткани для миссий.</p>
      </div>

      <div className="ui-menu-card">
        <div className="ui-stats-row">
          <span>Лучший счёт: <strong>{state.recordsSummary.bestScore}</strong></span>
          <span>Локальных игр: <strong>{state.recordsSummary.gamesPlayed}</strong></span>
        </div>
        <button className="ui-button ui-button-primary" type="button" onClick={actions.showLevelSelect}>
          ИГРАТЬ
        </button>
        <button className="ui-button" type="button" onClick={actions.showControls}>
          УПРАВЛЕНИЕ
        </button>
        <p className="ui-small-note">
          Уровень выбирается на отдельном экране. Следующий уровень открывается после победы над боссом.
        </p>
      </div>
    </section>
  );
}

function LevelSlide({ level, unlocked, onStart }: { level: LevelConfig; unlocked: boolean; onStart: () => void }): JSX.Element {
  const slideStyle: CSSProperties = {
    '--level-accent': hexColor(level.theme.accent),
    '--level-fill': hexColor(level.theme.panelFill),
    '--level-edge': hexColor(level.theme.panelEdge),
    '--level-bg': hexColor(level.theme.background),
    '--level-wall': hexColor(level.theme.wall),
    '--level-texture-a': hexColor(level.theme.textureA),
    '--level-texture-b': hexColor(level.theme.textureB),
    backgroundImage: level.imageUrl ? `url(${level.imageUrl})` : undefined
  } as CSSProperties;

  return (
    <article
      className={`level-slide ${unlocked ? 'level-slide-unlocked' : 'level-slide-locked'} ${level.imageUrl ? 'level-slide-has-image' : 'level-slide-placeholder'}`}
      style={slideStyle}
      aria-label={`Уровень ${level.id}: ${level.title}`}
    >
      <div className="level-slide-overlay" />
      <div className="level-slide-content">
        <div className="ui-eyebrow">Уровень {level.id} — {level.shortTitle}</div>
        <h2 className="level-slide-title">{level.title}</h2>
        <p className="level-slide-location">Локация: {level.location}</p>
        <p className="level-slide-description">{unlocked ? level.description : level.unlockHint}</p>
        <button
          className="ui-button ui-button-primary level-slide-start"
          type="button"
          disabled={!unlocked}
          onClick={onStart}
        >
          {unlocked ? 'НАЧАТЬ' : 'ЗАКРЫТО'}
        </button>
      </div>
    </article>
  );
}

function LevelSelect({ state, actions }: GameUiProps): JSX.Element {
  const initialIndex = useMemo(() => {
    const idx = LEVELS.findIndex((level) => level.id === state.selectedLevel.id);
    return idx >= 0 ? idx : 0;
  }, [state.selectedLevel.id]);

  const [activeIndex, setActiveIndex] = useState<number>(initialIndex);

  // Keep the slider in sync if selection changes externally (e.g. result screen).
  useEffect(() => {
    setActiveIndex(initialIndex);
  }, [initialIndex]);

  const total = LEVELS.length;
  const goPrev = useCallback(() => setActiveIndex((i) => (i - 1 + total) % total), [total]);
  const goNext = useCallback(() => setActiveIndex((i) => (i + 1) % total), [total]);

  // Arrow-key navigation.
  useEffect(() => {
    const onKey = (event: KeyboardEvent): void => {
      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        goPrev();
      } else if (event.key === 'ArrowRight') {
        event.preventDefault();
        goNext();
      } else if (event.key === 'Escape') {
        actions.showMainMenu();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [goPrev, goNext, actions]);

  return (
    <section className="ui-screen ui-levels-screen" aria-label="Выбор уровня">
      <div
        className="level-slider"
        style={{ ['--slide-count' as string]: total, ['--active-index' as string]: activeIndex } as CSSProperties}
      >
        <div
          className="level-slider-track"
          style={{ transform: `translateX(${-activeIndex * 100}%)` }}
        >
          {LEVELS.map((level) => (
            <LevelSlide
              key={level.id}
              level={level}
              unlocked={level.id <= state.unlockedLevelId}
              onStart={() => actions.startLevel(level)}
            />
          ))}
        </div>

        <button className="ui-back-button level-slider-back" type="button" onClick={actions.showMainMenu}>
          ← Назад
        </button>

        <button
          className="level-slider-arrow level-slider-arrow-prev"
          type="button"
          onClick={goPrev}
          aria-label="Предыдущий уровень"
        >
          ‹
        </button>
        <button
          className="level-slider-arrow level-slider-arrow-next"
          type="button"
          onClick={goNext}
          aria-label="Следующий уровень"
        >
          ›
        </button>

        <div className="level-slider-pagination" role="tablist" aria-label="Локации">
          {LEVELS.map((level, index) => (
            <button
              key={level.id}
              type="button"
              className={`level-slider-dot ${index === activeIndex ? 'active' : ''} ${level.id > state.unlockedLevelId ? 'locked' : ''}`}
              role="tab"
              aria-selected={index === activeIndex}
              aria-label={`Уровень ${level.id}: ${level.title}`}
              onClick={() => setActiveIndex(index)}
            />
          ))}
        </div>

        <p className="ui-progress-note level-slider-note">
          {state.unlockedLevelId >= 3 ? 'Все уровни открыты.' : 'Победи босса, чтобы открыть следующую локацию.'}
        </p>
      </div>
    </section>
  );
}

function ControlsScreen({ actions }: Pick<GameUiProps, 'actions'>): JSX.Element {
  return (
    <section className="ui-screen ui-modal-screen" aria-label="Управление">
      <div className="ui-modal-card">
        <div className="ui-eyebrow">как играть</div>
        <h1>УПРАВЛЕНИЕ</h1>
        <ul className="controls-list">
          <li>Стрелки или WASD — движение макрофага.</li>
          <li>Мышь — веди курсор, и макрофаг будет плыть к нему.</li>
          <li>Левая кнопка мыши, пробел или Z — выстрел.</li>
          <li>Esc или P — пауза / продолжить.</li>
          <li>Подбирай красные, синие и жёлтые бонусы, чтобы переключать оружие.</li>
        </ul>
        <button className="ui-button ui-button-primary" type="button" onClick={actions.showMainMenu}>ЗАКРЫТЬ</button>
      </div>
    </section>
  );
}

function ResultScreen({ state, actions }: GameUiProps): JSX.Element | null {
  const result = state.result;
  if (!result) return null;

  const isVictory = result.title === 'ПОБЕДА';
  const unlockText = isVictory
    ? result.nextLevel
      ? result.unlockedNextLevel
        ? `Открыт уровень ${result.nextLevel.id}: ${result.nextLevel.title}`
        : `Следующий уровень: ${result.nextLevel.title}`
      : 'Все уровни пройдены!'
    : 'Попробуй ещё раз, чтобы открыть следующий уровень.';

  return (
    <section className="ui-screen ui-modal-screen" aria-label="Результат игры">
      <div className={`ui-modal-card result-card ${isVictory ? 'result-victory' : 'result-defeat'}`}>
        <div className="ui-eyebrow">Уровень {result.level.id}: {result.level.title}</div>
        <h1>{result.title}</h1>
        <p className="result-score">Счёт: <strong>{result.score}</strong></p>
        <p className="result-record">{result.isNewRecord ? 'Новый локальный рекорд!' : `Лучший счёт: ${result.bestScore}`}</p>
        <p className="result-unlock">{unlockText}</p>
        <div className="result-actions">
          <button className="ui-button" type="button" onClick={() => actions.restartLevel(result.level)}>ЗАНОВО</button>
          {isVictory && result.nextLevel ? (
            <button className="ui-button ui-button-primary" type="button" onClick={() => actions.startLevel(result.nextLevel!)}>
              ДАЛЬШЕ: {result.nextLevel.title}
            </button>
          ) : null}
          <button className="ui-button" type="button" onClick={actions.showLevelSelect}>ВЫБОР УРОВНЯ</button>
          <button className="ui-button" type="button" onClick={actions.showMainMenu}>В МЕНЮ</button>
        </div>
      </div>
    </section>
  );
}

export function GameUi(props: GameUiProps): JSX.Element {
  return (
    <div className={`react-ui-shell ${props.state.screen === 'game' ? 'react-ui-shell-game' : ''}`}>
      {props.state.screen === 'main' ? <MainMenu {...props} /> : null}
      {props.state.screen === 'levels' ? <LevelSelect {...props} /> : null}
      {props.state.screen === 'controls' ? <ControlsScreen actions={props.actions} /> : null}
      {props.state.screen === 'result' ? <ResultScreen {...props} /> : null}
      {props.state.screen === 'designer' ? <DesignerPage onBack={props.actions.showMainMenu} /> : null}
      <button className="dev-corner-button" type="button" onClick={props.actions.showDesigner} aria-label="Открыть панель разработчика">
        DEV
      </button>
    </div>
  );
}
