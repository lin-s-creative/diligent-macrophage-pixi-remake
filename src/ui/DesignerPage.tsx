import { useMemo, useState } from 'react';
import initialDesignerConfig from '../config/designerConfig.json';
import { enemyPlacementPreview } from '../game/enemyPlacement';

type JsonPrimitive = string | number | boolean | null;
type JsonValue = JsonPrimitive | JsonObject | JsonValue[];
interface JsonObject {
  [key: string]: JsonValue;
}

type JsonPath = Array<string | number>;
type SaveTone = 'idle' | 'saving' | 'ok' | 'error';
type AdminTab = 'levels' | 'balance' | 'assets' | 'raw';
type TimelineKind = 'wave' | 'burst' | 'formation' | 'reward' | 'suppressAuto';
type TimelineEnemyType = 'coccus' | 'bacillus' | 'phage' | 'mixed';
type TimelineFormation = 'scattered' | 'line' | 'column' | 'diagonalDown' | 'diagonalUp' | 'wedge' | 'arc';
type TimelineIntensity = 'breather' | 'normal' | 'pressure' | 'panic';

interface DesignerPageProps {
  onBack: () => void;
}

interface SectionMeta {
  key: string;
  title: string;
  description: string;
}

interface FieldSpec {
  path: JsonPath;
  label: string;
  hint?: string;
  type?: 'text' | 'number' | 'color' | 'boolean';
  step?: string;
}

const CONFIG_FILE_PATH = 'src/config/designerConfig.json';
const TIMELINE_KINDS: readonly TimelineKind[] = ['wave', 'burst', 'formation', 'reward', 'suppressAuto'];
const TIMELINE_ENEMY_TYPES: readonly TimelineEnemyType[] = ['coccus', 'bacillus', 'phage', 'mixed'];
const TIMELINE_FORMATIONS: readonly TimelineFormation[] = ['scattered', 'line', 'column', 'diagonalDown', 'diagonalUp', 'wedge', 'arc'];
const TIMELINE_INTENSITIES: readonly TimelineIntensity[] = ['breather', 'normal', 'pressure', 'panic'];
const TIMELINE_TRACKS = ['coccus', 'bacillus', 'phage', 'mixed', 'reward', 'suppressAuto', 'boss'] as const;

const SECTION_META: readonly SectionMeta[] = [
  {
    key: 'constants',
    title: 'Экран + цвета',
    description: 'Размер игрового поля, базовая геометрия сосуда и общая палитра.'
  },
  {
    key: 'balance',
    title: 'Баланс',
    description: 'Игрок, враги, босс, оружие, бонусы и тайминги появления.'
  },
  {
    key: 'levels',
    title: 'Уровни',
    description: 'Тексты локаций, темы, параллакс, волны, босс и состав врагов.'
  },
  {
    key: 'assets',
    title: 'Ассеты',
    description: 'Пути к SVG-спрайтам и другим публичным файлам.'
  },
  {
    key: 'version',
    title: 'Версия',
    description: 'Версия формата дизайнерского конфига.'
  }
];

const initialConfig = initialDesignerConfig as unknown as JsonObject;

function cloneJson<T extends JsonValue>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function isJsonObject(value: JsonValue | undefined): value is JsonObject {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function cloneContainer(value: JsonValue): JsonValue {
  if (Array.isArray(value)) return [...value];
  if (isJsonObject(value)) return { ...value };
  return value;
}

function setAtPath(root: JsonObject, path: JsonPath, nextValue: JsonValue): JsonObject {
  if (path.length === 0) return isJsonObject(nextValue) ? nextValue : root;

  const nextRoot = cloneContainer(root) as JsonObject;
  let cursor: JsonValue = nextRoot;

  for (let i = 0; i < path.length - 1; i++) {
    const key = path[i];
    if (Array.isArray(cursor)) {
      const index = Number(key);
      cursor[index] = cloneContainer(cursor[index]);
      cursor = cursor[index];
    } else if (isJsonObject(cursor)) {
      const objectKey = String(key);
      cursor[objectKey] = cloneContainer(cursor[objectKey]);
      cursor = cursor[objectKey];
    }
  }

  const lastKey = path[path.length - 1];
  if (Array.isArray(cursor)) cursor[Number(lastKey)] = nextValue;
  else if (isJsonObject(cursor)) cursor[String(lastKey)] = nextValue;

  return nextRoot;
}

function deleteAtPath(root: JsonObject, path: JsonPath): JsonObject {
  if (path.length === 0) return root;

  const nextRoot = cloneContainer(root) as JsonObject;
  let cursor: JsonValue = nextRoot;

  for (let i = 0; i < path.length - 1; i++) {
    const key = path[i];
    if (Array.isArray(cursor)) {
      const index = Number(key);
      cursor[index] = cloneContainer(cursor[index]);
      cursor = cursor[index];
    } else if (isJsonObject(cursor)) {
      const objectKey = String(key);
      cursor[objectKey] = cloneContainer(cursor[objectKey]);
      cursor = cursor[objectKey];
    }
  }

  const lastKey = path[path.length - 1];
  if (Array.isArray(cursor)) cursor.splice(Number(lastKey), 1);
  else if (isJsonObject(cursor)) delete cursor[String(lastKey)];

  return nextRoot;
}

function getAtPath(root: JsonObject, path: JsonPath): JsonValue | undefined {
  let cursor: JsonValue | undefined = root;
  for (const key of path) {
    if (Array.isArray(cursor)) cursor = cursor[Number(key)];
    else if (isJsonObject(cursor)) cursor = cursor[String(key)];
    else return undefined;
  }
  return cursor;
}

function defaultValueFor(reference: JsonValue | undefined): JsonValue {
  if (reference === undefined) return '';
  if (Array.isArray(reference)) return cloneJson(reference);
  if (isJsonObject(reference)) return cloneJson(reference);
  if (typeof reference === 'number') return 0;
  if (typeof reference === 'boolean') return false;
  if (reference === null) return null;
  return '';
}

function pathLabel(path: JsonPath, fallback = 'config'): string {
  if (path.length === 0) return fallback;
  return path.map((part) => (typeof part === 'number' ? `[${part}]` : part)).join(' › ');
}

function shortLabel(path: JsonPath, fallback = 'value'): string {
  const last = path[path.length - 1];
  if (last === undefined) return fallback;
  return typeof last === 'number' ? `[${last}]` : last;
}

function isColorString(value: string): boolean {
  return /^#[0-9a-f]{6}$/i.test(value);
}

function isAssetPath(value: string): boolean {
  return /^\/.+\.(svg|png|jpe?g|webp|gif|avif)$/i.test(value);
}

function isSvgPath(value: string): boolean {
  return /^\/.+\.svg$/i.test(value);
}

function numericValue(value: JsonValue | undefined, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function booleanValue(value: JsonValue | undefined, fallback: boolean): boolean {
  return typeof value === 'boolean' ? value : fallback;
}

function stringValue<T extends string>(value: JsonValue | undefined, allowed: readonly T[], fallback: T): T {
  return typeof value === 'string' && allowed.includes(value as T) ? value as T : fallback;
}

function plainString(value: JsonValue | undefined, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}

function arrayPair(value: JsonValue | undefined, fallback: readonly [number, number]): [number, number] {
  if (!Array.isArray(value)) return [fallback[0], fallback[1]];
  return [numericValue(value[0], fallback[0]), numericValue(value[1], fallback[1])];
}

function onDeleteClick(event: React.MouseEvent<HTMLButtonElement>, onDelete: (() => void) | undefined): void {
  event.preventDefault();
  event.stopPropagation();
  onDelete?.();
}

function timelineEvents(level: JsonObject): JsonObject[] {
  return timelineEventsFromTimeline(ensureTimeline(level));
}

function timelineEventsFromTimeline(timeline: JsonObject): JsonObject[] {
  return Array.isArray(timeline.events) ? timeline.events.filter(isJsonObject) : [];
}

function ensureTimeline(level: JsonObject): JsonObject {
  const timeline = isJsonObject(level.enemyTimeline) ? level.enemyTimeline : {};
  return {
    enabled: timeline.enabled !== false,
    autoWavesEnabled: timeline.autoWavesEnabled !== false,
    events: Array.isArray(timeline.events) ? timeline.events : []
  };
}

function defaultTimelineEvent(time = 8): JsonObject {
  return {
    id: `event-${Date.now().toString(36)}`,
    time,
    kind: 'wave',
    label: 'Новая волна',
    enemyType: 'coccus',
    count: 3,
    duration: 1.8,
    formation: 'scattered',
    yRange: [0.25, 0.75],
    suppressAuto: false,
    intensityTag: 'normal'
  };
}

function defaultTimelineForLevel(level: JsonObject): JsonObject {
  const bossTime = Math.max(10, numericValue(level.bossAppearTime, 60));
  const waveInterval = Math.max(1, numericValue(level.waveInterval, 2));
  const [minWave, maxWave] = arrayPair(level.waveSize, [3, 5]);
  const count = Math.max(1, Math.round((minWave + maxWave) / 2));
  const events: JsonObject[] = [];
  for (let time = waveInterval; time < bossTime - 4; time += waveInterval * 3) {
    const index = events.length;
    events.push({
      id: `auto-preview-${index + 1}`,
      time: Number(time.toFixed(2)),
      kind: 'wave',
      label: `Авто-волна ${index + 1}`,
      enemyType: 'mixed',
      count,
      duration: 1.4,
      formation: index % 3 === 0 ? 'scattered' : index % 3 === 1 ? 'line' : 'wedge',
      yRange: [0.15, 0.85],
      suppressAuto: false,
      intensityTag: index % 4 === 3 ? 'pressure' : 'normal'
    });
  }
  return { enabled: true, autoWavesEnabled: true, events };
}

function trackForEvent(event: JsonObject): string {
  const kind = event.kind;
  if (kind === 'reward') return 'reward';
  if (kind === 'suppressAuto') return 'suppressAuto';
  const enemyType = event.enemyType;
  if (enemyType === 'bacillus' || enemyType === 'phage' || enemyType === 'mixed') return enemyType;
  return 'coccus';
}

function normalizedTimelineFormation(value: JsonValue | undefined): TimelineFormation {
  return stringValue(value, TIMELINE_FORMATIONS, 'scattered');
}

function enemyPlacementPreviewForEvent(event: JsonObject): ReturnType<typeof enemyPlacementPreview> {
  const kind = event.kind;
  if (kind === 'reward' || kind === 'suppressAuto') return [];
  return enemyPlacementPreview(
    numericValue(event.count, 0),
    normalizedTimelineFormation(event.formation),
    arrayPair(event.yRange, [0.25, 0.75]),
    numericValue(event.duration, 0),
    String(event.id ?? 'event')
  );
}

interface JsonEditorProps {
  value: JsonValue;
  path: JsonPath;
  depth?: number;
  onChange: (path: JsonPath, value: JsonValue) => void;
  onDelete?: (path: JsonPath) => void;
}

function JsonEditor({ value, path, depth = 0, onChange, onDelete }: JsonEditorProps): JSX.Element {
  const label = shortLabel(path, 'config');
  const fullLabel = pathLabel(path);
  const canDelete = depth > 0 && onDelete;

  if (Array.isArray(value)) {
    const addItem = (): void => {
      const reference = value[value.length - 1];
      onChange(path, [...value, defaultValueFor(reference)]);
    };

    return (
      <details className="designer-node designer-array-node" open={depth < 1}>
        <summary className="designer-node-summary">
          <span className="designer-node-title">{label}</span>
          <span className="designer-node-meta">array · {value.length}</span>
          <button className="designer-mini-button" type="button" onClick={(event) => onDeleteClick(event, addItem)}>
            + item
          </button>
          {canDelete ? (
            <button className="designer-mini-button designer-danger-button" type="button" onClick={(event) => onDeleteClick(event, () => onDelete(path))}>
              delete
            </button>
          ) : null}
        </summary>
        <div className="designer-node-children">
          {value.map((child, index) => (
            <JsonEditor
              key={`${fullLabel}.${index}`}
              value={child}
              path={[...path, index]}
              depth={depth + 1}
              onChange={onChange}
              onDelete={onDelete}
            />
          ))}
          {value.length === 0 ? <p className="designer-empty-note">Пустой массив. Нажми + item, чтобы добавить значение.</p> : null}
        </div>
      </details>
    );
  }

  if (isJsonObject(value)) {
    const entries = Object.entries(value);

    return (
      <details className="designer-node designer-object-node" open={depth < 1}>
        <summary className="designer-node-summary">
          <span className="designer-node-title">{label}</span>
          <span className="designer-node-meta">object · {entries.length}</span>
          {canDelete ? (
            <button className="designer-mini-button designer-danger-button" type="button" onClick={(event) => onDeleteClick(event, () => onDelete(path))}>
              delete
            </button>
          ) : null}
        </summary>
        <div className="designer-node-children">
          {entries.map(([key, child]) => (
            <JsonEditor
              key={`${fullLabel}.${key}`}
              value={child}
              path={[...path, key]}
              depth={depth + 1}
              onChange={onChange}
              onDelete={onDelete}
            />
          ))}
          {entries.length === 0 ? <p className="designer-empty-note">Пустой объект.</p> : null}
        </div>
      </details>
    );
  }

  return (
    <PrimitiveField
      value={value}
      path={path}
      label={label}
      fullLabel={fullLabel}
      onChange={onChange}
      onDelete={canDelete ? onDelete : undefined}
    />
  );
}

interface PrimitiveFieldProps {
  value: JsonPrimitive;
  path: JsonPath;
  label: string;
  fullLabel: string;
  onChange: (path: JsonPath, value: JsonValue) => void;
  onDelete?: (path: JsonPath) => void;
}

function PrimitiveField({ value, path, label, fullLabel, onChange, onDelete }: PrimitiveFieldProps): JSX.Element {
  const stringValueForInput = value === null ? '' : String(value);

  return (
    <label className="designer-field">
      <span className="designer-field-heading">
        <span className="designer-field-label">{label}</span>
        <span className="designer-field-path">{fullLabel}</span>
      </span>

      {typeof value === 'number' ? (
        <input
          className="designer-input"
          type="number"
          step="0.01"
          value={Number.isFinite(value) ? value : 0}
          onChange={(event) => {
            const next = Number(event.currentTarget.value);
            onChange(path, Number.isFinite(next) ? next : 0);
          }}
        />
      ) : null}

      {typeof value === 'string' && isColorString(value) ? (
        <span className="designer-color-row">
          <input
            className="designer-color-input"
            type="color"
            value={value}
            onChange={(event) => onChange(path, event.currentTarget.value)}
          />
          <input
            className="designer-input"
            type="text"
            value={value}
            onChange={(event) => onChange(path, event.currentTarget.value)}
          />
        </span>
      ) : null}

      {typeof value === 'string' && !isColorString(value) ? (
        <input
          className="designer-input"
          type="text"
          value={value}
          onChange={(event) => onChange(path, event.currentTarget.value)}
        />
      ) : null}

      {typeof value === 'boolean' ? (
        <span className="designer-checkbox-row">
          <input
            type="checkbox"
            checked={value}
            onChange={(event) => onChange(path, event.currentTarget.checked)}
          />
          <span>{value ? 'true' : 'false'}</span>
        </span>
      ) : null}

      {value === null ? (
        <input
          className="designer-input"
          type="text"
          value={stringValueForInput}
          placeholder="null"
          onChange={(event) => onChange(path, event.currentTarget.value)}
        />
      ) : null}

      {typeof value === 'string' && isAssetPath(value) ? (
        <a className="designer-inline-preview" href={value} target="_blank" rel="noreferrer" title="Открыть ассет">
          <img src={value} alt={label} />
        </a>
      ) : null}

      {onDelete ? (
        <button className="designer-mini-button designer-danger-button designer-field-delete" type="button" onClick={() => onDelete(path)}>
          delete
        </button>
      ) : null}
    </label>
  );
}

interface CompactFieldProps extends FieldSpec {
  config: JsonObject;
  onChange: (path: JsonPath, value: JsonValue) => void;
}

function CompactField({ config, onChange, path, label, hint, type, step = '0.01' }: CompactFieldProps): JSX.Element {
  const value = getAtPath(config, path);
  const resolvedType = type ?? (typeof value === 'number' ? 'number' : typeof value === 'boolean' ? 'boolean' : typeof value === 'string' && isColorString(value) ? 'color' : 'text');

  return (
    <label className="designer-compact-field">
      <span>
        <strong>{label}</strong>
        {hint ? <small>{hint}</small> : null}
      </span>
      {resolvedType === 'number' ? (
        <input className="designer-input" type="number" step={step} value={numericValue(value, 0)} onChange={(event) => onChange(path, Number(event.currentTarget.value))} />
      ) : null}
      {resolvedType === 'boolean' ? (
        <input type="checkbox" checked={booleanValue(value, false)} onChange={(event) => onChange(path, event.currentTarget.checked)} />
      ) : null}
      {resolvedType === 'color' ? (
        <span className="designer-color-row">
          <input className="designer-color-input" type="color" value={plainString(value, '#ffffff')} onChange={(event) => onChange(path, event.currentTarget.value)} />
          <input className="designer-input" type="text" value={plainString(value)} onChange={(event) => onChange(path, event.currentTarget.value)} />
        </span>
      ) : null}
      {resolvedType === 'text' ? (
        <input className="designer-input" type="text" value={plainString(value)} onChange={(event) => onChange(path, event.currentTarget.value)} />
      ) : null}
    </label>
  );
}

interface FieldCardProps {
  title: string;
  description?: string;
  children: React.ReactNode;
}

function FieldCard({ title, description, children }: FieldCardProps): JSX.Element {
  return (
    <section className="designer-tool-card">
      <header>
        <h3>{title}</h3>
        {description ? <p>{description}</p> : null}
      </header>
      <div className="designer-compact-grid">{children}</div>
    </section>
  );
}

function PairField({ config, onChange, path, label, labels, step = '0.01' }: { config: JsonObject; onChange: (path: JsonPath, value: JsonValue) => void; path: JsonPath; label: string; labels: readonly [string, string]; step?: string }): JSX.Element {
  const [first, second] = arrayPair(getAtPath(config, path), [0, 0]);
  const update = (index: 0 | 1, value: number): void => {
    onChange(path, index === 0 ? [value, second] : [first, value]);
  };

  return (
    <div className="designer-pair-field">
      <strong>{label}</strong>
      <label>
        {labels[0]}
        <input className="designer-input" type="number" step={step} value={first} onChange={(event) => update(0, Number(event.currentTarget.value))} />
      </label>
      <label>
        {labels[1]}
        <input className="designer-input" type="number" step={step} value={second} onChange={(event) => update(1, Number(event.currentTarget.value))} />
      </label>
    </div>
  );
}

interface BalanceEditorProps {
  config: JsonObject;
  onChange: (path: JsonPath, value: JsonValue) => void;
}

function BalanceEditor({ config, onChange }: BalanceEditorProps): JSX.Element {
  return (
    <div className="designer-tools-grid">
      <FieldCard title="Игрок" description="Размер, скорость и выживаемость макрофага.">
        <CompactField config={config} onChange={onChange} path={['balance', 'player', 'radius']} label="Хит-радиус" />
        <CompactField config={config} onChange={onChange} path={['balance', 'player', 'visualScale']} label="Визуальный масштаб" />
        <CompactField config={config} onChange={onChange} path={['balance', 'player', 'speed']} label="Скорость" />
        <CompactField config={config} onChange={onChange} path={['balance', 'player', 'maxHealth']} label="Здоровье" step="1" />
        <CompactField config={config} onChange={onChange} path={['balance', 'player', 'shotCooldown']} label="КД выстрела" />
        <CompactField config={config} onChange={onChange} path={['balance', 'player', 'invulnerabilityDuration']} label="Неуязвимость" />
      </FieldCard>

      {(['coccus', 'bacillus', 'phage'] as const).map((enemy) => (
        <FieldCard key={enemy} title={`Враг: ${enemy}`} description="HP, хитбокс, размер спрайта и скорость.">
          <CompactField config={config} onChange={onChange} path={['balance', 'enemies', enemy, 'hp']} label="HP" step="1" />
          <CompactField config={config} onChange={onChange} path={['balance', 'enemies', enemy, 'hitRadius']} label="Хит-радиус" />
          <CompactField config={config} onChange={onChange} path={['balance', 'enemies', enemy, 'visualScale']} label="Размер" />
          <CompactField config={config} onChange={onChange} path={['balance', 'enemies', enemy, 'value']} label="Очки" step="1" />
          <PairField config={config} onChange={onChange} path={['balance', 'enemies', enemy, 'speed']} label="Скорость" labels={['min', 'max']} />
        </FieldCard>
      ))}

      <FieldCard title="Босс" description="Габариты, живучесть, стоимость и огонь босса.">
        <CompactField config={config} onChange={onChange} path={['balance', 'boss', 'hp']} label="HP" step="1" />
        <CompactField config={config} onChange={onChange} path={['balance', 'boss', 'hitRadius']} label="Хит-радиус" />
        <CompactField config={config} onChange={onChange} path={['balance', 'boss', 'visualScale']} label="Размер" />
        <CompactField config={config} onChange={onChange} path={['balance', 'boss', 'speed']} label="Скорость" />
        <CompactField config={config} onChange={onChange} path={['balance', 'boss', 'shootInterval']} label="КД выстрела" />
        <CompactField config={config} onChange={onChange} path={['balance', 'boss', 'homingShootInterval']} label="КД самонаводки" />
      </FieldCard>

      <FieldCard title="Бонусы и спавн" description="Общие интервалы появления и бонусного оружия.">
        <CompactField config={config} onChange={onChange} path={['balance', 'spawning', 'waveInterval']} label="Авто-волна" />
        <CompactField config={config} onChange={onChange} path={['balance', 'spawning', 'bossAppearTime']} label="Босс через" />
        <CompactField config={config} onChange={onChange} path={['balance', 'bonus', 'hitRadius']} label="Хит-радиус бонуса" />
        <CompactField config={config} onChange={onChange} path={['balance', 'bonus', 'buffDuration']} label="Длительность баффа" />
        <CompactField config={config} onChange={onChange} path={['balance', 'bonus', 'rotationInterval']} label="Ротация бонусов" />
      </FieldCard>
    </div>
  );
}

interface LevelDesignerProps {
  config: JsonObject;
  levelIndex: number;
  selectedEventId: string | null;
  onLevelIndexChange: (index: number) => void;
  onSelectedEventIdChange: (id: string | null) => void;
  onChange: (path: JsonPath, value: JsonValue) => void;
}

function LevelDesigner({ config, levelIndex, selectedEventId, onLevelIndexChange, onSelectedEventIdChange, onChange }: LevelDesignerProps): JSX.Element {
  const levels = Array.isArray(config.levels) ? config.levels.filter(isJsonObject) : [];
  const safeIndex = Math.min(levelIndex, Math.max(0, levels.length - 1));
  const level = levels[safeIndex];

  if (!level) return <p className="designer-empty-note">В конфиге нет уровней.</p>;

  const levelPath: JsonPath = ['levels', safeIndex];
  const title = plainString(level.title, `Level ${safeIndex + 1}`);

  return (
    <div className="designer-level-workspace">
      <aside className="designer-level-sidebar">
        <h2>Уровни</h2>
        <div className="designer-level-list">
          {levels.map((entry, index) => (
            <button
              key={`${String(entry.id ?? index)}-${index}`}
              className={`designer-level-button ${index === safeIndex ? 'designer-level-button-active' : ''}`}
              type="button"
              onClick={() => {
                onLevelIndexChange(index);
                onSelectedEventIdChange(null);
              }}
            >
              <strong>{Number(entry.id) || index + 1}. {String(entry.shortTitle ?? entry.title ?? 'level')}</strong>
              <span>{String(entry.location ?? '')}</span>
            </button>
          ))}
        </div>
        <div className="designer-level-summary">
          <strong>{title}</strong>
          <span>Босс: {numericValue(level.bossAppearTime, 60)}s</span>
          <span>Авто-волна: {numericValue(level.waveInterval, 2)}s</span>
          <span>Событий: {timelineEvents(level).length}</span>
        </div>
      </aside>

      <main className="designer-level-main">
        <div className="designer-level-header">
          <div>
            <h2>{title}</h2>
            <p>Редактируется только выбранный уровень. Таймлайн ниже управляет ручным расположением врагов по времени.</p>
          </div>
          <label className="designer-level-select-label">
            Быстрый выбор
            <select className="designer-input" value={safeIndex} onChange={(event) => { onLevelIndexChange(Number(event.currentTarget.value)); onSelectedEventIdChange(null); }}>
              {levels.map((entry, index) => <option key={index} value={index}>{Number(entry.id) || index + 1}: {String(entry.title ?? 'level')}</option>)}
            </select>
          </label>
        </div>

        <div className="designer-tools-grid designer-level-tools-grid">
          <FieldCard title="Паспорт" description="Тексты меню и идентификация локации.">
            <CompactField config={config} onChange={onChange} path={[...levelPath, 'title']} label="Название" />
            <CompactField config={config} onChange={onChange} path={[...levelPath, 'shortTitle']} label="Коротко" />
            <CompactField config={config} onChange={onChange} path={[...levelPath, 'location']} label="Локация" />
            <CompactField config={config} onChange={onChange} path={[...levelPath, 'description']} label="Описание" />
          </FieldCard>

          <FieldCard title="Волны и босс" description="Ключевые темпы забега.">
            <CompactField config={config} onChange={onChange} path={[...levelPath, 'waveInterval']} label="Авто-волна, сек" />
            <PairField config={config} onChange={onChange} path={[...levelPath, 'waveSize']} label="Размер волны" labels={['min', 'max']} step="1" />
            <CompactField config={config} onChange={onChange} path={[...levelPath, 'bossAppearTime']} label="Босс на секунде" />
            <CompactField config={config} onChange={onChange} path={[...levelPath, 'scrollSpeed']} label="Скролл" />
            <CompactField config={config} onChange={onChange} path={[...levelPath, 'enemySpeedMultiplier']} label="Множитель скорости" />
            <CompactField config={config} onChange={onChange} path={[...levelPath, 'enemyHpBonus']} label="Бонус HP врагам" step="1" />
          </FieldCard>

          <FieldCard title="Смесь врагов" description="Вероятности по прогрессу уровня от старта до босса.">
            <CompactField config={config} onChange={onChange} path={[...levelPath, 'enemyMix', 'coccusStart']} label="Coccus start" />
            <CompactField config={config} onChange={onChange} path={[...levelPath, 'enemyMix', 'coccusEnd']} label="Coccus end" />
            <CompactField config={config} onChange={onChange} path={[...levelPath, 'enemyMix', 'bacillusStart']} label="Bacillus start" />
            <CompactField config={config} onChange={onChange} path={[...levelPath, 'enemyMix', 'bacillusEnd']} label="Bacillus end" />
          </FieldCard>

          <FieldCard title="Геометрия сосуда" description="Размеры прохода и форма стенок.">
            <CompactField config={config} onChange={onChange} path={[...levelPath, 'geometry', 'topBase']} label="Верх" />
            <CompactField config={config} onChange={onChange} path={[...levelPath, 'geometry', 'bottomBase']} label="Низ" />
            <CompactField config={config} onChange={onChange} path={[...levelPath, 'geometry', 'wave']} label="Волна" />
            <CompactField config={config} onChange={onChange} path={[...levelPath, 'geometry', 'secondaryWave']} label="Втор. волна" />
          </FieldCard>

          <FieldCard title="Фаги и босс" description="Огонь особых врагов и босса для этого уровня.">
            <CompactField config={config} onChange={onChange} path={[...levelPath, 'phageShootInterval']} label="Фаг стреляет" />
            <CompactField config={config} onChange={onChange} path={[...levelPath, 'phageHomingShootInterval']} label="Фаг самонаводка" />
            <CompactField config={config} onChange={onChange} path={[...levelPath, 'bossHp']} label="HP босса" step="1" />
            <CompactField config={config} onChange={onChange} path={[...levelPath, 'bossShootInterval']} label="Босс стреляет" />
            <CompactField config={config} onChange={onChange} path={[...levelPath, 'bossHomingShootInterval']} label="Босс самонаводка" />
            <CompactField config={config} onChange={onChange} path={[...levelPath, 'bossValue']} label="Очки за босса" step="1" />
          </FieldCard>
        </div>

        <EnemyTimelineDesigner
          level={level}
          levelIndex={safeIndex}
          selectedEventId={selectedEventId}
          onSelectedEventIdChange={onSelectedEventIdChange}
          onChange={onChange}
        />

        <details className="designer-advanced-json">
          <summary>Advanced: raw JSON выбранного уровня</summary>
          <JsonEditor value={level} path={levelPath} onChange={onChange} onDelete={(path) => onChange(path, '')} />
        </details>
      </main>
    </div>
  );
}

interface EnemyTimelineDesignerProps {
  level: JsonObject;
  levelIndex: number;
  selectedEventId: string | null;
  onSelectedEventIdChange: (id: string | null) => void;
  onChange: (path: JsonPath, value: JsonValue) => void;
}

function EnemyTimelineDesigner({ level, levelIndex, selectedEventId, onSelectedEventIdChange, onChange }: EnemyTimelineDesignerProps): JSX.Element {
  const timeline = ensureTimeline(level);
  const timelinePath: JsonPath = ['levels', levelIndex, 'enemyTimeline'];
  const eventsPath: JsonPath = [...timelinePath, 'events'];
  const sourceEvents = timelineEventsFromTimeline(timeline);
  const events = sourceEvents.map((event, originalIndex) => ({ event, originalIndex })).sort((a, b) => numericValue(a.event.time, 0) - numericValue(b.event.time, 0));
  const selectedEntry = events.find(({ event }) => String(event.id ?? '') === selectedEventId) ?? events[0] ?? null;
  const selectedEvent = selectedEntry?.event ?? null;
  const bossTime = Math.max(10, numericValue(level.bossAppearTime, 60));
  const hasSavedTimeline = isJsonObject(level.enemyTimeline);

  const updateTimelineField = (key: string, value: JsonValue): void => onChange([...timelinePath, key], value);
  const initializeTimeline = (): void => {
    const nextTimeline = defaultTimelineForLevel(level);
    onChange(timelinePath, nextTimeline);
    const nextEvents = timelineEventsFromTimeline(nextTimeline);
    onSelectedEventIdChange(nextEvents.length > 0 ? String(nextEvents[0].id ?? '') : null);
  };
  const updateEventField = (key: string, value: JsonValue): void => {
    if (!selectedEntry) return;
    onChange([...eventsPath, selectedEntry.originalIndex, key], value);
  };
  const updateEventYRange = (index: 0 | 1, value: number): void => {
    if (!selectedEvent) return;
    const [min, max] = arrayPair(selectedEvent.yRange, [0.25, 0.75]);
    updateEventField('yRange', index === 0 ? [value, max] : [min, value]);
  };
  const addEvent = (kind: TimelineKind): void => {
    const next = defaultTimelineEvent(Math.min(Math.max(2, bossTime - 4), 6 + events.length * 6));
    next.kind = kind;
    if (kind === 'reward') {
      next.enemyType = 'coccus';
      next.count = 4;
      next.formation = 'wedge';
      next.label = 'Наградная группа';
      next.intensityTag = 'breather';
    }
    if (kind === 'suppressAuto') {
      next.enemyType = 'mixed';
      next.count = 0;
      next.duration = 4;
      next.label = 'Пауза авто-волн';
      next.suppressAuto = true;
      next.intensityTag = 'breather';
    }
    onChange(eventsPath, [...sourceEvents, next]);
    onSelectedEventIdChange(String(next.id));
  };
  const duplicateSelected = (): void => {
    if (!selectedEvent) return;
    const next = cloneJson(selectedEvent);
    next.id = `event-${Date.now().toString(36)}`;
    next.time = numericValue(selectedEvent.time, 0) + 2;
    next.label = `${String(selectedEvent.label ?? selectedEvent.kind ?? 'event')} copy`;
    onChange(eventsPath, [...sourceEvents, next]);
    onSelectedEventIdChange(String(next.id));
  };
  const deleteSelected = (): void => {
    if (!selectedEntry) return;
    onChange(eventsPath, sourceEvents.filter((_, index) => index !== selectedEntry.originalIndex));
    onSelectedEventIdChange(null);
  };

  const density = Array.from({ length: 20 }, (_, index) => {
    const start = (index / 20) * bossTime;
    const end = ((index + 1) / 20) * bossTime;
    return sourceEvents.reduce((sum, event) => {
      const time = numericValue(event.time, 0);
      return time >= start && time < end ? sum + Math.max(1, numericValue(event.count, 1)) : sum;
    }, 0);
  });
  const maxDensity = Math.max(1, ...density);
  const selectedYRange = selectedEvent ? arrayPair(selectedEvent.yRange, [0.25, 0.75]) : [0.25, 0.75] as const;

  return (
    <section className="enemy-timeline-designer" aria-label="Таймлайн врагов">
      <header className="timeline-header">
        <div>
          <h3>Таймлайн врагов</h3>
          <p>Карточки показывают, когда и в какой линии появляются события. Горизонталь — время до босса, вертикаль — тип события.</p>
        </div>
        <div className="timeline-flags">
          <label className="timeline-toggle"><input type="checkbox" checked={timeline.enabled !== false} onChange={(event) => updateTimelineField('enabled', event.currentTarget.checked)} /> Scripted timeline</label>
          <label className="timeline-toggle"><input type="checkbox" checked={timeline.autoWavesEnabled !== false} onChange={(event) => updateTimelineField('autoWavesEnabled', event.currentTarget.checked)} /> Auto waves</label>
        </div>
      </header>

      {!hasSavedTimeline ? (
        <div className="timeline-empty-callout">
          <strong>Для этого уровня таймлайн ещё не задан.</strong>
          <span>Сейчас игра использует только авто-волны. Нажми Generate timeline, чтобы создать редактируемые события из текущих wave settings.</span>
          <button className="designer-mini-button" type="button" onClick={initializeTimeline}>Generate timeline</button>
        </div>
      ) : null}

      <div className="timeline-add-buttons">
        {TIMELINE_KINDS.map((kind) => <button className="designer-mini-button" type="button" key={kind} onClick={() => addEvent(kind)}>+ {kind}</button>)}
      </div>

      <div className="timeline-density" aria-label="Плотность врагов">
        {density.map((value, index) => <span key={index} style={{ height: `${18 + (value / maxDensity) * 62}%` }} title={`${value} enemies`} />)}
      </div>

      <div className="timeline-workbench">
        <div className="timeline-board">
          <div className="timeline-ruler">
            {Array.from({ length: 9 }, (_, index) => <span key={index} style={{ left: `${(index / 8) * 100}%` }}>{Math.round((index / 8) * bossTime)}s</span>)}
          </div>
          {TIMELINE_TRACKS.map((track) => (
            <div className="timeline-track" key={track}>
              <div className="timeline-track-label">{track}</div>
              <div className="timeline-track-lane">
                {track === 'boss' ? <div className="timeline-boss-marker" style={{ left: '100%' }}>BOSS</div> : null}
                {events.filter(({ event }) => trackForEvent(event) === track).map(({ event }) => {
                  const id = String(event.id ?? 'event');
                  const left = Math.min(98, Math.max(0, (numericValue(event.time, 0) / bossTime) * 100));
                  const width = Math.max(5, (Math.max(0.6, numericValue(event.duration, 1.2)) / bossTime) * 100);
                  const isSelected = selectedEvent === event;
                  const previewPoints = enemyPlacementPreviewForEvent(event);
                  const maxPreviewX = Math.max(1, ...previewPoints.map((point) => point.x));
                  return (
                    <button
                      className={`timeline-event-card timeline-event-${String(event.intensityTag ?? 'normal')} ${isSelected ? 'timeline-event-selected' : ''}`}
                      type="button"
                      key={id}
                      style={{ left: `${left}%`, width: `${width}%` }}
                      onClick={() => onSelectedEventIdChange(id)}
                    >
                      <span>{String(event.label ?? event.kind ?? id)}</span>
                      <small>{String(event.enemyType ?? 'mixed')} ×{numericValue(event.count, 0)} · y {arrayPair(event.yRange, [0.25, 0.75]).join('-')}</small>
                      <span className="timeline-event-placement" aria-hidden="true">
                        {previewPoints.map((point, index) => (
                          <i key={index} style={{ left: `${Math.min(96, Math.max(4, (point.x / maxPreviewX) * 100))}%`, top: `${Math.min(86, Math.max(14, point.yT * 100))}%` }} />
                        ))}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <aside className="timeline-inspector">
          <h3>Инспектор события</h3>
          {selectedEvent ? (
            <>
              <label>Label<input className="designer-input" value={String(selectedEvent.label ?? '')} onChange={(event) => updateEventField('label', event.currentTarget.value)} /></label>
              <label>Time<input className="designer-input" type="number" step="0.5" value={numericValue(selectedEvent.time, 0)} onChange={(event) => updateEventField('time', Number(event.currentTarget.value))} /></label>
              <label>Kind<select className="designer-input" value={stringValue(selectedEvent.kind, TIMELINE_KINDS, 'wave')} onChange={(event) => updateEventField('kind', event.currentTarget.value)}>{TIMELINE_KINDS.map((kind) => <option key={kind}>{kind}</option>)}</select></label>
              <label>Enemy<select className="designer-input" value={stringValue(selectedEvent.enemyType, TIMELINE_ENEMY_TYPES, 'coccus')} onChange={(event) => updateEventField('enemyType', event.currentTarget.value)}>{TIMELINE_ENEMY_TYPES.map((type) => <option key={type}>{type}</option>)}</select></label>
              <label>Count<input className="designer-input" type="number" step="1" value={numericValue(selectedEvent.count, 1)} onChange={(event) => updateEventField('count', Number(event.currentTarget.value))} /></label>
              <label>Duration<input className="designer-input" type="number" step="0.5" value={numericValue(selectedEvent.duration, 1)} onChange={(event) => updateEventField('duration', Number(event.currentTarget.value))} /></label>
              <label>Formation<select className="designer-input" value={stringValue(selectedEvent.formation, TIMELINE_FORMATIONS, 'scattered')} onChange={(event) => updateEventField('formation', event.currentTarget.value)}>{TIMELINE_FORMATIONS.map((formation) => <option key={formation}>{formation}</option>)}</select></label>
              <label>Intensity<select className="designer-input" value={stringValue(selectedEvent.intensityTag, TIMELINE_INTENSITIES, 'normal')} onChange={(event) => updateEventField('intensityTag', event.currentTarget.value)}>{TIMELINE_INTENSITIES.map((intensity) => <option key={intensity}>{intensity}</option>)}</select></label>
              <div className="timeline-range-fields">
                <label>Y min<input className="designer-input" type="number" min="0" max="1" step="0.05" value={selectedYRange[0]} onChange={(event) => updateEventYRange(0, Number(event.currentTarget.value))} /></label>
                <label>Y max<input className="designer-input" type="number" min="0" max="1" step="0.05" value={selectedYRange[1]} onChange={(event) => updateEventYRange(1, Number(event.currentTarget.value))} /></label>
              </div>
              <label className="timeline-toggle"><input type="checkbox" checked={Boolean(selectedEvent.suppressAuto)} onChange={(event) => updateEventField('suppressAuto', event.currentTarget.checked)} /> suppress auto waves</label>
              <div className="timeline-inspector-actions">
                <button className="designer-mini-button" type="button" onClick={duplicateSelected}>Duplicate</button>
                <button className="designer-mini-button designer-danger-button" type="button" onClick={deleteSelected}>Delete</button>
              </div>
            </>
          ) : <p className="designer-empty-note">Выбери событие на таймлайне или создай новое.</p>}
        </aside>
      </div>
    </section>
  );
}

function collectSpriteEntries(config: JsonObject): Array<[string, string]> {
  const assets = config.assets;
  if (!isJsonObject(assets)) return [];
  const sprites = assets.sprites;
  if (!isJsonObject(sprites)) return [];
  return Object.entries(sprites).filter((entry): entry is [string, string] => typeof entry[1] === 'string' && isSvgPath(entry[1]));
}

interface ParallaxPreviewEntry {
  level: string;
  layer: number;
  imageUrl: string;
  speed: JsonValue;
  alpha: JsonValue;
}

function collectParallaxEntries(config: JsonObject): ParallaxPreviewEntry[] {
  const levels = config.levels;
  if (!Array.isArray(levels)) return [];

  const result: ParallaxPreviewEntry[] = [];
  levels.forEach((levelValue) => {
    if (!isJsonObject(levelValue)) return;
    const title = typeof levelValue.title === 'string' ? levelValue.title : 'level';
    const id = typeof levelValue.id === 'number' ? levelValue.id : '?';
    const parallax = levelValue.parallax;
    if (!isJsonObject(parallax) || !Array.isArray(parallax.layers)) return;

    parallax.layers.forEach((layerValue, index) => {
      if (!isJsonObject(layerValue) || typeof layerValue.imageUrl !== 'string') return;
      result.push({
        level: `${id}: ${title}`,
        layer: index + 1,
        imageUrl: layerValue.imageUrl,
        speed: layerValue.speed,
        alpha: layerValue.alpha
      });
    });
  });

  return result;
}

function AssetsEditor({ config, onChange }: { config: JsonObject; onChange: (path: JsonPath, value: JsonValue) => void }): JSX.Element {
  const spriteEntries = collectSpriteEntries(config);
  const parallaxEntries = collectParallaxEntries(config);

  return (
    <div className="designer-assets-workspace">
      <FieldCard title="SVG спрайты" description="Пути можно менять, превью обновится сразу.">
        {spriteEntries.map(([name, path]) => (
          <label className="designer-asset-editor" key={name}>
            <span>
              <strong>{name}</strong>
              <img src={path} alt={name} />
            </span>
            <input className="designer-input" value={path} onChange={(event) => onChange(['assets', 'sprites', name], event.currentTarget.value)} />
          </label>
        ))}
      </FieldCard>

      <section className="designer-tool-card">
        <header>
          <h3>Параллакс уровней</h3>
          <p>Краткая карта слоёв, сами значения редактируются в выбранном уровне через advanced JSON.</p>
        </header>
        <div className="designer-parallax-list">
          {parallaxEntries.map((entry) => (
            <a className="designer-parallax-card" key={`${entry.level}-${entry.layer}-${entry.imageUrl}`} href={entry.imageUrl} target="_blank" rel="noreferrer">
              <img src={entry.imageUrl} alt={`${entry.level} layer ${entry.layer}`} />
              <span>
                <strong>{entry.level}</strong>
                layer {entry.layer} · speed {String(entry.speed ?? '—')} · alpha {String(entry.alpha ?? '—')}
              </span>
            </a>
          ))}
          {parallaxEntries.length === 0 ? <p className="designer-empty-note">Параллакс-слои не найдены.</p> : null}
        </div>
      </section>
    </div>
  );
}

function DesignerPreviewPanel({ config }: { config: JsonObject }): JSX.Element {
  const spriteEntries = collectSpriteEntries(config);
  const levels = Array.isArray(config.levels) ? config.levels.filter(isJsonObject) : [];
  const totalEvents = levels.reduce((sum, level) => sum + timelineEvents(level).length, 0);

  return (
    <aside className="designer-preview-panel" aria-label="Предпросмотр ассетов">
      <div className="designer-help-card">
        <h2>Как это работает</h2>
        <p>
          Save config пишет JSON прямо в проект: <strong>{CONFIG_FILE_PATH}</strong>. После сохранения обнови страницу
          или начни новый забег, чтобы увидеть изменения в игре.
        </p>
      </div>

      <div className="designer-stat-grid">
        <span><strong>{levels.length}</strong> уровней</span>
        <span><strong>{totalEvents}</strong> событий</span>
        <span><strong>{spriteEntries.length}</strong> спрайтов</span>
      </div>

      <div className="designer-help-card">
        <h2>Мини-превью</h2>
        <div className="designer-preview-grid designer-preview-grid-compact">
          {spriteEntries.slice(0, 12).map(([name, path]) => (
            <a className="designer-asset-card" key={name} href={path} target="_blank" rel="noreferrer">
              <span>{name}</span>
              <img src={path} alt={name} />
            </a>
          ))}
        </div>
      </div>
    </aside>
  );
}

export function DesignerPage({ onBack }: DesignerPageProps): JSX.Element {
  const [config, setConfig] = useState<JsonObject>(() => cloneJson(initialConfig));
  const [activeTab, setActiveTab] = useState<AdminTab>('levels');
  const [levelIndex, setLevelIndex] = useState(0);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [saveTone, setSaveTone] = useState<SaveTone>('idle');
  const [saveMessage, setSaveMessage] = useState<string>('Изменения пока только в браузере. Нажми SAVE CONFIG, чтобы записать их в проект.');

  const sections = useMemo<SectionMeta[]>(() => {
    const known = SECTION_META.filter((section) => Object.prototype.hasOwnProperty.call(config, section.key));
    const knownKeys = new Set(known.map((section) => section.key));
    const extra = Object.keys(config)
      .filter((key) => !knownKeys.has(key))
      .map((key) => ({ key, title: key, description: 'Дополнительная секция конфига.' }));
    return [...known, ...extra];
  }, [config]);

  const updateValue = (path: JsonPath, value: JsonValue): void => {
    setConfig((current) => setAtPath(current, path, value));
    setSaveTone('idle');
    setSaveMessage('Есть несохранённые изменения.');
  };

  const removeValue = (path: JsonPath): void => {
    setConfig((current) => deleteAtPath(current, path));
    setSaveTone('idle');
    setSaveMessage('Есть несохранённые изменения.');
  };

  const resetConfig = (): void => {
    setConfig(cloneJson(initialConfig));
    setSaveTone('idle');
    setSaveMessage('Локальные правки сброшены до версии, загруженной из проекта.');
  };

  const saveConfig = async (): Promise<void> => {
    setSaveTone('saving');
    setSaveMessage('Сохраняю JSON в проект...');

    try {
      const response = await fetch('/__designer/save-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: CONFIG_FILE_PATH, content: config })
      });
      const payload = await response.json().catch(() => ({ ok: false, error: 'Bad JSON response from dev server.' })) as { ok?: boolean; error?: string; path?: string };

      if (!response.ok || !payload.ok) {
        throw new Error(payload.error ?? `HTTP ${response.status}`);
      }

      setSaveTone('ok');
      setSaveMessage(`Сохранено в ${payload.path ?? CONFIG_FILE_PATH}. Обнови страницу или начни новый забег для применения.`);
    } catch (error) {
      setSaveTone('error');
      setSaveMessage(`Не удалось сохранить. Проверь, что запущен Vite dev server с новым vite.config.ts. ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  return (
    <section className="ui-screen designer-screen" aria-label="Панель геймдизайнера">
      <header className="designer-header designer-header-compact">
        <div>
          <div className="ui-eyebrow">dev tools</div>
          <h1>ПАНЕЛЬ ГЕЙМДИЗАЙНЕРА</h1>
          <p>Компактные инструменты: отдельный редактор уровня, баланс и таймлайн расположения врагов.</p>
        </div>
        <div className="designer-header-actions">
          <button className="ui-button designer-compact-button" type="button" onClick={onBack}>← В меню</button>
          <button className="ui-button designer-compact-button" type="button" onClick={resetConfig}>Reset</button>
          <button className="ui-button ui-button-primary designer-compact-button" type="button" onClick={() => void saveConfig()} disabled={saveTone === 'saving'}>
            {saveTone === 'saving' ? 'Saving...' : 'Save config'}
          </button>
        </div>
      </header>

      <div className={`designer-save-status designer-save-status-${saveTone}`}>{saveMessage}</div>

      <nav className="designer-mode-tabs" aria-label="Инструменты админки">
        <button className={`designer-mode-tab ${activeTab === 'levels' ? 'designer-mode-tab-active' : ''}`} type="button" onClick={() => setActiveTab('levels')}>Уровни + таймлайн</button>
        <button className={`designer-mode-tab ${activeTab === 'balance' ? 'designer-mode-tab-active' : ''}`} type="button" onClick={() => setActiveTab('balance')}>Баланс и размеры</button>
        <button className={`designer-mode-tab ${activeTab === 'assets' ? 'designer-mode-tab-active' : ''}`} type="button" onClick={() => setActiveTab('assets')}>Ассеты</button>
        <button className={`designer-mode-tab ${activeTab === 'raw' ? 'designer-mode-tab-active' : ''}`} type="button" onClick={() => setActiveTab('raw')}>Raw JSON</button>
      </nav>

      <div className="designer-layout designer-layout-compact">
        <main className="designer-editor-panel designer-editor-panel-compact">
          {activeTab === 'levels' ? (
            <LevelDesigner
              config={config}
              levelIndex={levelIndex}
              selectedEventId={selectedEventId}
              onLevelIndexChange={setLevelIndex}
              onSelectedEventIdChange={setSelectedEventId}
              onChange={updateValue}
            />
          ) : null}
          {activeTab === 'balance' ? <BalanceEditor config={config} onChange={updateValue} /> : null}
          {activeTab === 'assets' ? <AssetsEditor config={config} onChange={updateValue} /> : null}
          {activeTab === 'raw' ? (
            <div className="designer-raw-workspace">
              <div className="designer-section-heading">
                <h2>Raw JSON</h2>
                <p>Резервный редактор всех секций для полей, которых нет в компактных карточках.</p>
              </div>
              <div className="designer-raw-sections">
                {sections.map((section) => (
                  <details className="designer-advanced-json" key={section.key} open={section.key === 'constants'}>
                    <summary>{section.title} · {section.description}</summary>
                    <JsonEditor value={config[section.key] ?? null} path={[section.key]} onChange={updateValue} onDelete={removeValue} />
                  </details>
                ))}
              </div>
            </div>
          ) : null}
        </main>

        <DesignerPreviewPanel config={config} />
      </div>
    </section>
  );
}
