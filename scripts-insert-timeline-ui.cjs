const fs = require('fs');
const p = 'src/ui/DesignerPage.tsx';
let s = fs.readFileSync(p, 'utf8');
s = s.replace("type SaveTone = 'idle' | 'saving' | 'ok' | 'error';\n", "type SaveTone = 'idle' | 'saving' | 'ok' | 'error';\ntype TimelineKind = 'wave' | 'burst' | 'formation' | 'reward' | 'suppressAuto';\ntype TimelineEnemyType = 'coccus' | 'bacillus' | 'phage' | 'mixed';\ntype TimelineFormation = 'scattered' | 'line' | 'column' | 'diagonalDown' | 'diagonalUp' | 'wedge' | 'arc';\ntype TimelineIntensity = 'breather' | 'normal' | 'pressure' | 'panic';\n");
s = s.replace("const CONFIG_FILE_PATH = 'src/config/designerConfig.json';\n", "const CONFIG_FILE_PATH = 'src/config/designerConfig.json';\nconst TIMELINE_KINDS: readonly TimelineKind[] = ['wave', 'burst', 'formation', 'reward', 'suppressAuto'];\nconst TIMELINE_ENEMY_TYPES: readonly TimelineEnemyType[] = ['coccus', 'bacillus', 'phage', 'mixed'];\nconst TIMELINE_FORMATIONS: readonly TimelineFormation[] = ['scattered', 'line', 'column', 'diagonalDown', 'diagonalUp', 'wedge', 'arc'];\nconst TIMELINE_INTENSITIES: readonly TimelineIntensity[] = ['breather', 'normal', 'pressure', 'panic'];\nconst TIMELINE_TRACKS = ['coccus', 'bacillus', 'phage', 'reward', 'suppressAuto', 'boss'] as const;\n");
const insert = String.raw`
function numericValue(value: JsonValue | undefined, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function stringValue<T extends string>(value: JsonValue | undefined, allowed: readonly T[], fallback: T): T {
  return typeof value === 'string' && allowed.includes(value as T) ? value as T : fallback;
}

function timelineEvents(level: JsonObject): JsonObject[] {
  const timeline = level.enemyTimeline;
  if (!isJsonObject(timeline) || !Array.isArray(timeline.events)) return [];
  return timeline.events.filter(isJsonObject);
}

function ensureTimeline(level: JsonObject): JsonObject {
  const timeline = isJsonObject(level.enemyTimeline) ? level.enemyTimeline : {};
  return { enabled: timeline.enabled !== false, autoWavesEnabled: timeline.autoWavesEnabled !== false, events: Array.isArray(timeline.events) ? timeline.events : [] };
}

function defaultTimelineEvent(time = 8): JsonObject {
  return {
    id: ` + "`event-${Date.now().toString(36)}`" + `,
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

function trackForEvent(event: JsonObject): string {
  const kind = event.kind;
  if (kind === 'reward') return 'reward';
  if (kind === 'suppressAuto') return 'suppressAuto';
  const enemyType = event.enemyType;
  return enemyType === 'bacillus' || enemyType === 'phage' ? enemyType : 'coccus';
}

interface EnemyTimelineDesignerProps {
  config: JsonObject;
  onChange: (path: JsonPath, value: JsonValue) => void;
}

function EnemyTimelineDesigner({ config, onChange }: EnemyTimelineDesignerProps): JSX.Element | null {
  const levels = Array.isArray(config.levels) ? config.levels.filter(isJsonObject) : [];
  const [levelIndex, setLevelIndex] = useState(0);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const level = levels[levelIndex];
  if (!level) return null;

  const timeline = ensureTimeline(level);
  const events = timelineEvents(level).sort((a, b) => numericValue(a.time, 0) - numericValue(b.time, 0));
  const selectedEvent = events.find((event) => event.id === selectedEventId) ?? events[0] ?? null;
  const selectedIndex = selectedEvent ? events.indexOf(selectedEvent) : -1;
  const bossTime = Math.max(10, numericValue(level.bossAppearTime, 60));
  const title = typeof level.title === 'string' ? level.title : ` + "`Level ${levelIndex + 1}`" + `;
  const timelinePath: JsonPath = ['levels', levelIndex, 'enemyTimeline'];
  const eventsPath: JsonPath = [...timelinePath, 'events'];

  const updateTimelineField = (key: string, value: JsonValue): void => onChange([...timelinePath, key], value);
  const updateEventField = (key: string, value: JsonValue): void => {
    if (selectedIndex < 0) return;
    onChange([...eventsPath, selectedIndex, key], value);
  };
  const addEvent = (kind: TimelineKind): void => {
    const next = defaultTimelineEvent(Math.min(bossTime - 4, 6 + events.length * 6));
    next.kind = kind;
    if (kind === 'reward') { next.enemyType = 'coccus'; next.count = 4; next.formation = 'wedge'; next.label = 'Наградная группа'; }
    if (kind === 'suppressAuto') { next.enemyType = 'mixed'; next.count = 0; next.duration = 4; next.label = 'Пауза авто-волн'; next.suppressAuto = true; }
    onChange(eventsPath, [...events, next]);
    setSelectedEventId(String(next.id));
  };
  const deleteSelected = (): void => {
    if (selectedIndex < 0) return;
    onChange(eventsPath, events.filter((_, index) => index !== selectedIndex));
    setSelectedEventId(null);
  };

  const density = Array.from({ length: 16 }, (_, index) => {
    const start = (index / 16) * bossTime;
    const end = ((index + 1) / 16) * bossTime;
    return events.reduce((sum, event) => {
      const time = numericValue(event.time, 0);
      return time >= start && time < end ? sum + Math.max(1, numericValue(event.count, 1)) : sum;
    }, 0);
  });
  const maxDensity = Math.max(1, ...density);

  return (
    <section className="enemy-timeline-designer" aria-label="Enemy timeline">
      <div className="timeline-toolbar">
        <label className="timeline-select-label">
          Уровень
          <select className="designer-input" value={levelIndex} onChange={(event) => { setLevelIndex(Number(event.currentTarget.value)); setSelectedEventId(null); }}>
            {levels.map((entry, index) => <option key={index} value={index}>{Number(entry.id) || index + 1}: {String(entry.title ?? 'level')}</option>)}
          </select>
        </label>
        <label className="timeline-toggle"><input type="checkbox" checked={timeline.enabled !== false} onChange={(event) => updateTimelineField('enabled', event.currentTarget.checked)} /> Scripted timeline</label>
        <label className="timeline-toggle"><input type="checkbox" checked={timeline.autoWavesEnabled !== false} onChange={(event) => updateTimelineField('autoWavesEnabled', event.currentTarget.checked)} /> Auto waves</label>
        <div className="timeline-add-buttons">
          {TIMELINE_KINDS.map((kind) => <button className="designer-mini-button" type="button" key={kind} onClick={() => addEvent(kind)}>+ {kind}</button>)}
        </div>
      </div>

      <div className="timeline-summary">
        <strong>{title}</strong> · {events.length} events · boss at {bossTime}s · управляет драматургией поверх живых авто-волн.
      </div>

      <div className="timeline-density">
        {density.map((value, index) => <span key={index} style={{ height: ` + "`${18 + (value / maxDensity) * 62}%`" + ` }} title={` + "`${value} enemies`" + `} />)}
      </div>

      <div className="timeline-board">
        <div className="timeline-ruler">
          {Array.from({ length: 9 }, (_, index) => <span key={index} style={{ left: ` + "`${(index / 8) * 100}%`" + ` }}>{Math.round((index / 8) * bossTime)}s</span>)}
        </div>
        {TIMELINE_TRACKS.map((track) => (
          <div className="timeline-track" key={track}>
            <div className="timeline-track-label">{track}</div>
            <div className="timeline-track-lane">
              {track === 'boss' ? <div className="timeline-boss-marker" style={{ left: '100%' }}>BOSS</div> : null}
              {events.filter((event) => trackForEvent(event) === track).map((event) => {
                const id = String(event.id ?? 'event');
                const left = Math.min(98, Math.max(0, (numericValue(event.time, 0) / bossTime) * 100));
                const width = Math.max(5, (Math.max(0.6, numericValue(event.duration, 1.2)) / bossTime) * 100);
                return <button className={` + "`timeline-event-card timeline-event-${String(event.intensityTag ?? 'normal')} ${selectedEvent === event ? 'timeline-event-selected' : ''}`" + `} type="button" key={id} style={{ left: ` + "`${left}%`" + `, width: ` + "`${width}%`" + ` }} onClick={() => setSelectedEventId(id)}>{String(event.label ?? event.kind ?? id)}<small>{String(event.enemyType ?? 'mixed')} ×{numericValue(event.count, 0)}</small></button>;
              })}
            </div>
          </div>
        ))}
      </div>

      {selectedEvent ? (
        <div className="timeline-inspector">
          <h3>Инспектор события</h3>
          <label>Label<input className="designer-input" value={String(selectedEvent.label ?? '')} onChange={(event) => updateEventField('label', event.currentTarget.value)} /></label>
          <label>Time<input className="designer-input" type="number" step="0.5" value={numericValue(selectedEvent.time, 0)} onChange={(event) => updateEventField('time', Number(event.currentTarget.value))} /></label>
          <label>Kind<select className="designer-input" value={stringValue(selectedEvent.kind, TIMELINE_KINDS, 'wave')} onChange={(event) => updateEventField('kind', event.currentTarget.value)}>{TIMELINE_KINDS.map((kind) => <option key={kind}>{kind}</option>)}</select></label>
          <label>Enemy<select className="designer-input" value={stringValue(selectedEvent.enemyType, TIMELINE_ENEMY_TYPES, 'coccus')} onChange={(event) => updateEventField('enemyType', event.currentTarget.value)}>{TIMELINE_ENEMY_TYPES.map((type) => <option key={type}>{type}</option>)}</select></label>
          <label>Count<input className="designer-input" type="number" value={numericValue(selectedEvent.count, 1)} onChange={(event) => updateEventField('count', Number(event.currentTarget.value))} /></label>
          <label>Duration<input className="designer-input" type="number" step="0.5" value={numericValue(selectedEvent.duration, 1)} onChange={(event) => updateEventField('duration', Number(event.currentTarget.value))} /></label>
          <label>Formation<select className="designer-input" value={stringValue(selectedEvent.formation, TIMELINE_FORMATIONS, 'scattered')} onChange={(event) => updateEventField('formation', event.currentTarget.value)}>{TIMELINE_FORMATIONS.map((formation) => <option key={formation}>{formation}</option>)}</select></label>
          <label>Intensity<select className="designer-input" value={stringValue(selectedEvent.intensityTag, TIMELINE_INTENSITIES, 'normal')} onChange={(event) => updateEventField('intensityTag', event.currentTarget.value)}>{TIMELINE_INTENSITIES.map((intensity) => <option key={intensity}>{intensity}</option>)}</select></label>
          <label className="timeline-toggle"><input type="checkbox" checked={Boolean(selectedEvent.suppressAuto)} onChange={(event) => updateEventField('suppressAuto', event.currentTarget.checked)} /> suppress auto waves during this block</label>
          <button className="designer-mini-button designer-danger-button" type="button" onClick={deleteSelected}>Delete event</button>
        </div>
      ) : <p className="designer-empty-note">Выбери событие на таймлайне или создай новое.</p>}
    </section>
  );
}

`;
s = s.replace('function DesignerPreviewPanel({ config }: { config: JsonObject }): JSX.Element {', insert + 'function DesignerPreviewPanel({ config }: { config: JsonObject }): JSX.Element {');
s = s.replace(`              <JsonEditor
                value={activeValue ?? null}
                path={[activeSection.key]}
                onChange={updateValue}
                onDelete={removeValue}
              />`, `              {activeSection.key === 'levels' ? <EnemyTimelineDesigner config={config} onChange={updateValue} /> : null}
              <JsonEditor
                value={activeValue ?? null}
                path={[activeSection.key]}
                onChange={updateValue}
                onDelete={removeValue}
              />`);
fs.writeFileSync(p, s);
