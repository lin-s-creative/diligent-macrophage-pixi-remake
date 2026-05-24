import type { RecordsStore, RecordsSummary, ScoreRecord } from './RecordsStore';

/**
 * Future Vercel API adapter. Keep game logic dependent on RecordsStore,
 * then swap BrowserRecordsStore with this implementation when a remote
 * leaderboard endpoint and database are added.
 */
export class RemoteRecordsStore implements RecordsStore {
  constructor(private readonly baseUrl = '/api/records') {}

  async addRecord(record: Omit<ScoreRecord, 'id' | 'createdAt'>): Promise<ScoreRecord> {
    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(record)
    });

    if (!response.ok) {
      throw new Error(`Failed to save record: ${response.status}`);
    }

    return response.json() as Promise<ScoreRecord>;
  }

  async getSummary(limit = 5): Promise<RecordsSummary> {
    const response = await fetch(`${this.baseUrl}?limit=${limit}`);
    if (!response.ok) {
      throw new Error(`Failed to load records: ${response.status}`);
    }

    return response.json() as Promise<RecordsSummary>;
  }
}
