import Database from 'better-sqlite3';
import { join } from 'node:path';

const DB_PATH = process.env['DATABASE_URL'] ?? join(process.cwd(), 'kairo.db');

let _db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!_db) {
    _db = new Database(DB_PATH);
    _db.pragma('journal_mode = WAL');
    _db.pragma('foreign_keys = ON');
    initSchema(_db);
  }
  return _db;
}

function initSchema(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS runs (
      id TEXT PRIMARY KEY,
      project_path TEXT NOT NULL,
      target_url TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      exit_reason TEXT,
      total_iterations INTEGER DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS test_results (
      id TEXT PRIMARY KEY,
      run_id TEXT NOT NULL REFERENCES runs(id),
      iteration INTEGER NOT NULL,
      run_number INTEGER NOT NULL,
      test_id TEXT NOT NULL,
      file TEXT NOT NULL,
      title TEXT NOT NULL,
      status TEXT NOT NULL,
      duration INTEGER NOT NULL DEFAULT 0,
      error_message TEXT,
      screenshot_path TEXT,
      trace_path TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS classifications (
      id TEXT PRIMARY KEY,
      run_id TEXT NOT NULL REFERENCES runs(id),
      iteration INTEGER NOT NULL,
      test_id TEXT NOT NULL,
      file TEXT NOT NULL,
      title TEXT NOT NULL,
      category TEXT NOT NULL,
      run1_error TEXT,
      run2_error TEXT,
      evidence TEXT,
      screenshot_path TEXT,
      trace_path TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS fixes (
      id TEXT PRIMARY KEY,
      run_id TEXT NOT NULL REFERENCES runs(id),
      iteration INTEGER NOT NULL,
      test_id TEXT NOT NULL,
      confidence TEXT NOT NULL,
      description TEXT NOT NULL,
      code_snippet TEXT,
      affected_file TEXT,
      applied INTEGER NOT NULL DEFAULT 0,
      dismissed INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);
}
