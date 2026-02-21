import * as SQLite from 'expo-sqlite';

let db: SQLite.SQLiteDatabase | null = null;
let dbReady: Promise<SQLite.SQLiteDatabase> | null = null;

// Serialize all DB access — prevents the Android NullPointerException
// caused by concurrent native calls (known expo-sqlite bug)
let queue: Promise<unknown> = Promise.resolve();

function serialize<T>(fn: () => Promise<T>): Promise<T> {
  const next = queue.then(fn, fn);
  queue = next.then(() => {}, () => {});
  return next;
}

async function openDb(): Promise<SQLite.SQLiteDatabase> {
  // useNewConnection: true avoids stale native handle on Android
  const database = await SQLite.openDatabaseAsync('parkspeak.db', {
    useNewConnection: true,
  });
  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      started_at TEXT NOT NULL,
      ended_at TEXT,
      type TEXT NOT NULL DEFAULT 'free',
      exercises_completed INTEGER DEFAULT 0
    );
  `);
  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS attempts (
      id TEXT PRIMARY KEY,
      session_id TEXT,
      exercise_id TEXT,
      exercise_type TEXT,
      recorded_at TEXT NOT NULL,
      duration_seconds INTEGER,
      avg_loudness REAL,
      intelligibility REAL,
      recognized_text TEXT,
      target_text TEXT,
      language TEXT DEFAULT 'en'
    );
  `);
  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS daily_stats (
      date TEXT PRIMARY KEY,
      sessions_count INTEGER DEFAULT 0,
      total_duration_seconds INTEGER DEFAULT 0,
      avg_loudness REAL,
      avg_intelligibility REAL,
      exercises_completed INTEGER DEFAULT 0
    );
  `);
  // Migrations — add columns for new features (safe to re-run)
  try { await database.execAsync(`ALTER TABLE attempts ADD COLUMN perception TEXT`); } catch {}
  try { await database.execAsync(`ALTER TABLE attempts ADD COLUMN measured_value REAL`); } catch {}
  try { await database.execAsync(`ALTER TABLE attempts ADD COLUMN avg_mouth_opening REAL`); } catch {}
  try { await database.execAsync(`ALTER TABLE attempts ADD COLUMN avg_lip_compression REAL`); } catch {}
  try { await database.execAsync(`ALTER TABLE attempts ADD COLUMN avg_jaw_displacement REAL`); } catch {}

  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS hearing_tests (
      id TEXT PRIMARY KEY,
      tested_at TEXT NOT NULL,
      srt_db REAL NOT NULL,
      result TEXT NOT NULL,
      trials_json TEXT,
      ambient_noise_db REAL,
      language TEXT DEFAULT 'en'
    );
  `);

  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS carryover_challenges (
      id TEXT PRIMARY KEY,
      date TEXT NOT NULL,
      challenge_id TEXT NOT NULL,
      completed INTEGER DEFAULT 0,
      partner_rating INTEGER,
      notes TEXT
    );
  `);

  return database;
}

export function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (!dbReady) {
    dbReady = openDb().then((database) => {
      db = database;
      return database;
    }).catch((e) => {
      dbReady = null;
      throw e;
    });
  }
  return dbReady;
}

// Reset connection on next use (e.g. after error)
function resetDb() {
  db = null;
  dbReady = null;
}

// Format a value for raw SQL embedding
function sql(val: unknown): string {
  if (val === undefined || val === null) return 'NULL';
  if (typeof val === 'number') return String(val);
  return `'${String(val).replace(/'/g, "''")}'`;
}

// Retry wrapper — retries once with a fresh connection on failure
async function withRetry<T>(fn: (database: SQLite.SQLiteDatabase) => Promise<T>): Promise<T> {
  try {
    const database = await getDatabase();
    return await fn(database);
  } catch (e) {
    console.log('[DB] Retrying with fresh connection...');
    resetDb();
    const database = await getDatabase();
    return await fn(database);
  }
}

// --- Sessions ---

export async function createSession(type: string = 'free'): Promise<string> {
  return serialize(async () => {
    return withRetry(async (database) => {
      const id = generateId();
      await database.execAsync(
        `INSERT INTO sessions (id, started_at, type) VALUES (${sql(id)}, ${sql(new Date().toISOString())}, ${sql(type)})`
      );
      return id;
    });
  });
}

export async function endSession(sessionId: string, exercisesCompleted: number) {
  return serialize(async () => {
    return withRetry(async (database) => {
      await database.execAsync(
        `UPDATE sessions SET ended_at = ${sql(new Date().toISOString())}, exercises_completed = ${sql(exercisesCompleted)} WHERE id = ${sql(sessionId)}`
      );
    });
  });
}

// --- Attempts ---

export type Perception = 'quiet' | 'right' | 'loud';

export interface AttemptRecord {
  exerciseId: string;
  exerciseType: string;
  sessionId?: string;
  durationSeconds: number;
  avgLoudness: number | null;
  intelligibility: number | null;
  recognizedText: string;
  targetText: string;
  language: string;
  perception?: Perception | null;
  measuredValue?: number | null;
  avgMouthOpening?: number | null;
  avgLipCompression?: number | null;
  avgJawDisplacement?: number | null;
}

export async function saveAttempt(attempt: AttemptRecord): Promise<string> {
  return serialize(async () => {
    return withRetry(async (database) => {
      const id = generateId();
      const now = new Date().toISOString();

      // Build INSERT dynamically — only include columns with non-null values
      const cols: string[] = ['id', 'exercise_id', 'exercise_type', 'recorded_at', 'duration_seconds', 'language'];
      const vals: string[] = [sql(id), sql(attempt.exerciseId), sql(attempt.exerciseType), sql(now), sql(attempt.durationSeconds), sql(attempt.language)];

      if (attempt.sessionId != null) { cols.push('session_id'); vals.push(sql(attempt.sessionId)); }
      if (attempt.avgLoudness != null) { cols.push('avg_loudness'); vals.push(sql(attempt.avgLoudness)); }
      if (attempt.intelligibility != null) { cols.push('intelligibility'); vals.push(sql(attempt.intelligibility)); }
      if (attempt.recognizedText) { cols.push('recognized_text'); vals.push(sql(attempt.recognizedText)); }
      if (attempt.targetText) { cols.push('target_text'); vals.push(sql(attempt.targetText)); }
      if (attempt.perception) { cols.push('perception'); vals.push(sql(attempt.perception)); }
      if (attempt.measuredValue != null) { cols.push('measured_value'); vals.push(sql(attempt.measuredValue)); }
      if (attempt.avgMouthOpening != null) { cols.push('avg_mouth_opening'); vals.push(sql(attempt.avgMouthOpening)); }
      if (attempt.avgLipCompression != null) { cols.push('avg_lip_compression'); vals.push(sql(attempt.avgLipCompression)); }
      if (attempt.avgJawDisplacement != null) { cols.push('avg_jaw_displacement'); vals.push(sql(attempt.avgJawDisplacement)); }

      await database.execAsync(
        `INSERT INTO attempts (${cols.join(', ')}) VALUES (${vals.join(', ')})`
      );

      await doUpdateDailyStats(database, attempt);
      return id;
    });
  });
}

// --- Daily Stats ---

async function doUpdateDailyStats(database: SQLite.SQLiteDatabase, attempt: AttemptRecord) {
  const today = new Date().toISOString().split('T')[0];

  const existing = await database.getFirstAsync<{
    date: string;
    sessions_count: number;
    total_duration_seconds: number;
    avg_loudness: number | null;
    avg_intelligibility: number | null;
    exercises_completed: number;
  }>(`SELECT * FROM daily_stats WHERE date = ${sql(today)}`);

  if (existing) {
    const newCount = existing.exercises_completed + 1;
    const newDuration = existing.total_duration_seconds + attempt.durationSeconds;

    let newAvgLoudness = existing.avg_loudness;
    if (attempt.avgLoudness != null) {
      if (existing.avg_loudness != null) {
        newAvgLoudness =
          (existing.avg_loudness * existing.exercises_completed + attempt.avgLoudness) / newCount;
      } else {
        newAvgLoudness = attempt.avgLoudness;
      }
    }

    let newAvgIntelligibility = existing.avg_intelligibility;
    if (attempt.intelligibility != null) {
      if (existing.avg_intelligibility != null) {
        newAvgIntelligibility =
          (existing.avg_intelligibility * existing.exercises_completed + attempt.intelligibility) /
          newCount;
      } else {
        newAvgIntelligibility = attempt.intelligibility;
      }
    }

    const sets = [
      `total_duration_seconds = ${sql(newDuration)}`,
      `exercises_completed = ${sql(newCount)}`,
    ];
    if (newAvgLoudness != null) sets.push(`avg_loudness = ${sql(newAvgLoudness)}`);
    if (newAvgIntelligibility != null) sets.push(`avg_intelligibility = ${sql(newAvgIntelligibility)}`);

    await database.execAsync(
      `UPDATE daily_stats SET ${sets.join(', ')} WHERE date = ${sql(today)}`
    );
  } else {
    const cols = ['date', 'sessions_count', 'total_duration_seconds', 'exercises_completed'];
    const vals = [sql(today), '1', sql(attempt.durationSeconds), '1'];

    if (attempt.avgLoudness != null) { cols.push('avg_loudness'); vals.push(sql(attempt.avgLoudness)); }
    if (attempt.intelligibility != null) { cols.push('avg_intelligibility'); vals.push(sql(attempt.intelligibility)); }

    await database.execAsync(
      `INSERT INTO daily_stats (${cols.join(', ')}) VALUES (${vals.join(', ')})`
    );
  }
}

// --- Queries ---

export interface DailyStat {
  date: string;
  sessions_count: number;
  total_duration_seconds: number;
  avg_loudness: number | null;
  avg_intelligibility: number | null;
  exercises_completed: number;
}

export async function getTodayStats(): Promise<DailyStat | null> {
  return serialize(async () => {
    const database = await getDatabase();
    const today = new Date().toISOString().split('T')[0];
    return database.getFirstAsync<DailyStat>(`SELECT * FROM daily_stats WHERE date = ${sql(today)}`);
  });
}

export async function getWeeklyStats(): Promise<DailyStat[]> {
  return serialize(async () => {
    const database = await getDatabase();
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    return database.getAllAsync<DailyStat>(
      `SELECT * FROM daily_stats WHERE date >= ${sql(weekAgo)} ORDER BY date ASC`
    );
  });
}

export async function getMonthlyStats(): Promise<DailyStat[]> {
  return serialize(async () => {
    const database = await getDatabase();
    const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    return database.getAllAsync<DailyStat>(
      `SELECT * FROM daily_stats WHERE date >= ${sql(monthAgo)} ORDER BY date ASC`
    );
  });
}

export async function getCurrentStreak(): Promise<number> {
  return serialize(async () => {
    const database = await getDatabase();
    const stats = await database.getAllAsync<{ date: string }>(
      'SELECT date FROM daily_stats WHERE exercises_completed > 0 ORDER BY date DESC LIMIT 60'
    );

    if (stats.length === 0) return 0;

    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < stats.length; i++) {
      const expectedDate = new Date(today);
      expectedDate.setDate(expectedDate.getDate() - i);
      const expectedStr = expectedDate.toISOString().split('T')[0];

      if (stats[i].date === expectedStr) {
        streak++;
      } else {
        break;
      }
    }

    return streak;
  });
}

export async function getRecentAttempts(limit: number = 20): Promise<
  Array<{
    id: string;
    exercise_type: string;
    recorded_at: string;
    duration_seconds: number;
    avg_loudness: number | null;
    intelligibility: number | null;
    recognized_text: string;
  }>
> {
  return serialize(async () => {
    const database = await getDatabase();
    return database.getAllAsync(
      `SELECT id, exercise_type, recorded_at, duration_seconds, avg_loudness, intelligibility, recognized_text FROM attempts ORDER BY recorded_at DESC LIMIT ${sql(limit)}`
    );
  });
}

// --- Perception Stats ---

export async function getPerceptionStats(days: number = 30): Promise<{
  total: number;
  correct: number;
}> {
  return serialize(async () => {
    const database = await getDatabase();
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const rows = await database.getAllAsync<{
      perception: string;
      avg_loudness: number;
    }>(
      `SELECT perception, avg_loudness FROM attempts WHERE perception IS NOT NULL AND avg_loudness IS NOT NULL AND recorded_at >= ${sql(since)}`
    );
    let correct = 0;
    for (const row of rows) {
      const ratio = row.avg_loudness;
      const p = row.perception;
      if ((p === 'quiet' && ratio < 1.5) || (p === 'right' && ratio >= 1.5 && ratio <= 3.0) || (p === 'loud' && ratio > 3.0)) {
        correct++;
      }
    }
    return { total: rows.length, correct };
  });
}

// --- Adaptive Difficulty ---

export async function getRecentAccuracyByType(
  exerciseType: string,
  limit: number = 10
): Promise<number | null> {
  return serialize(async () => {
    const database = await getDatabase();
    const row = await database.getFirstAsync<{ avg_score: number | null }>(
      `SELECT AVG(intelligibility) as avg_score FROM (SELECT intelligibility FROM attempts WHERE exercise_type = ${sql(exerciseType)} AND intelligibility IS NOT NULL ORDER BY recorded_at DESC LIMIT ${sql(limit)})`
    );
    return row?.avg_score ?? null;
  });
}

// --- Carryover Challenges ---

export interface CarryoverRecord {
  id: string;
  date: string;
  challenge_id: string;
  completed: number;
  partner_rating: number | null;
  notes: string | null;
}

export async function getTodayCarryover(): Promise<CarryoverRecord | null> {
  return serialize(async () => {
    const database = await getDatabase();
    const today = new Date().toISOString().split('T')[0];
    return database.getFirstAsync<CarryoverRecord>(
      `SELECT * FROM carryover_challenges WHERE date = ${sql(today)}`
    );
  });
}

export async function saveCarryoverCompletion(
  challengeId: string,
  partnerRating?: number
): Promise<void> {
  return serialize(async () => {
    return withRetry(async (database) => {
      const today = new Date().toISOString().split('T')[0];
      const existing = await database.getFirstAsync<{ id: string }>(
        `SELECT id FROM carryover_challenges WHERE date = ${sql(today)}`
      );
      if (existing) {
        const sets = ['completed = 1'];
        if (partnerRating != null) sets.push(`partner_rating = ${sql(partnerRating)}`);
        await database.execAsync(
          `UPDATE carryover_challenges SET ${sets.join(', ')} WHERE id = ${sql(existing.id)}`
        );
      } else {
        const id = generateId();
        const cols = ['id', 'date', 'challenge_id', 'completed'];
        const vals = [sql(id), sql(today), sql(challengeId), '1'];
        if (partnerRating != null) { cols.push('partner_rating'); vals.push(sql(partnerRating)); }
        await database.execAsync(
          `INSERT INTO carryover_challenges (${cols.join(', ')}) VALUES (${vals.join(', ')})`
        );
      }
    });
  });
}

export async function getCarryoverStats(days: number = 30): Promise<{ completed: number; total: number }> {
  return serialize(async () => {
    const database = await getDatabase();
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const row = await database.getFirstAsync<{ cnt: number }>(
      `SELECT COUNT(*) as cnt FROM carryover_challenges WHERE date >= ${sql(since)} AND completed = 1`
    );
    return { completed: row?.cnt ?? 0, total: days };
  });
}

// --- Attempts in Range (for reports) ---

export async function getExerciseBreakdown(
  startDate: string,
  endDate: string
): Promise<Record<string, number>> {
  return serialize(async () => {
    const database = await getDatabase();
    const rows = await database.getAllAsync<{ exercise_type: string; cnt: number }>(
      `SELECT exercise_type, COUNT(*) as cnt FROM attempts WHERE recorded_at >= ${sql(startDate)} AND recorded_at <= ${sql(endDate)} GROUP BY exercise_type`
    );
    const result: Record<string, number> = {};
    for (const row of rows) {
      result[row.exercise_type] = row.cnt;
    }
    return result;
  });
}

export async function getStatsInRange(
  startDate: string,
  endDate: string
): Promise<{
  sessionsCount: number;
  totalDurationSeconds: number;
  exercisesCompleted: number;
  avgLoudness: number | null;
  avgIntelligibility: number | null;
}> {
  return serialize(async () => {
    const database = await getDatabase();
    const row = await database.getFirstAsync<{
      sessions: number;
      duration: number;
      exercises: number;
      loudness: number | null;
      intel: number | null;
    }>(
      `SELECT COUNT(*) as exercises, SUM(duration_seconds) as duration, AVG(avg_loudness) as loudness, AVG(intelligibility) as intel, COUNT(DISTINCT session_id) as sessions FROM attempts WHERE recorded_at >= ${sql(startDate)} AND recorded_at <= ${sql(endDate)}`
    );
    return {
      sessionsCount: row?.sessions ?? 0,
      totalDurationSeconds: row?.duration ?? 0,
      exercisesCompleted: row?.exercises ?? 0,
      avgLoudness: row?.loudness ?? null,
      avgIntelligibility: row?.intel ?? null,
    };
  });
}

// --- Hearing Tests ---

export interface HearingTestRecord {
  srtDb: number;
  result: string;
  trialsJson: string;
  ambientNoiseDb: number | null;
  language: string;
}

export async function saveHearingTest(record: HearingTestRecord): Promise<string> {
  return serialize(async () => {
    return withRetry(async (database) => {
      const id = generateId();
      const now = new Date().toISOString();
      const cols = ['id', 'tested_at', 'srt_db', 'result', 'language'];
      const vals = [sql(id), sql(now), sql(record.srtDb), sql(record.result), sql(record.language)];

      if (record.trialsJson) { cols.push('trials_json'); vals.push(sql(record.trialsJson)); }
      if (record.ambientNoiseDb != null) { cols.push('ambient_noise_db'); vals.push(sql(record.ambientNoiseDb)); }

      await database.execAsync(
        `INSERT INTO hearing_tests (${cols.join(', ')}) VALUES (${vals.join(', ')})`
      );
      return id;
    });
  });
}

export async function getLatestHearingTest(): Promise<{
  tested_at: string;
  srt_db: number;
  result: string;
} | null> {
  return serialize(async () => {
    const database = await getDatabase();
    return database.getFirstAsync(
      'SELECT tested_at, srt_db, result FROM hearing_tests ORDER BY tested_at DESC LIMIT 1'
    );
  });
}

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 8);
}
