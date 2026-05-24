export interface ScoreRecord {
  id: string;
  score: number;
  title: string;
  createdAt: string;
  elapsedTime: number;
}

export interface RecordsSummary {
  bestScore: number;
  gamesPlayed: number;
  records: ScoreRecord[];
}

export interface RecordsStore {
  addRecord(record: Omit<ScoreRecord, 'id' | 'createdAt'>): Promise<ScoreRecord>;
  getSummary(limit?: number): Promise<RecordsSummary>;
}
