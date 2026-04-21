import sqlite3 from "sqlite3";
import { open, Database } from "sqlite";
import path from "path";

let db: Database | null = null;

export async function getDb() {
  if (db) return db;

  const dbPath = path.resolve(process.cwd(), "database.sqlite");
  
  db = await open({
    filename: dbPath,
    driver: sqlite3.Database,
  });

  // Initialize tables
  await db.exec(`
    CREATE TABLE IF NOT EXISTS analyses (
      id TEXT PRIMARY KEY,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      project_root TEXT,
      path TEXT,
      analysis TEXT,
      provider TEXT,
      model TEXT,
      is_pinned INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT
    );
  `);

  return db;
}
