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

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 8);
}
