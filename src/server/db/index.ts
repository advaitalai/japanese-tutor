import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";

export type DB = Database.Database;

const MIGRATIONS: string[] = [
  `CREATE TABLE turns (
     id INTEGER PRIMARY KEY, day TEXT NOT NULL, at TEXT NOT NULL,
     speaker TEXT NOT NULL CHECK (speaker IN ('learner','yui')),
     mode TEXT NOT NULL, text TEXT NOT NULL, parts_json TEXT,
     confidence REAL, jp_attempt INTEGER, slow INTEGER DEFAULT 0, audio_ref TEXT);
   CREATE INDEX turns_day ON turns(day, id);
   CREATE TABLE fixes (
     id INTEGER PRIMARY KEY, turn_id INTEGER NOT NULL REFERENCES turns(id), day TEXT NOT NULL,
     wrong TEXT NOT NULL, right_json TEXT NOT NULL, why TEXT NOT NULL, tag TEXT);
   CREATE TABLE asked (
     id INTEGER PRIMARY KEY, turn_id INTEGER NOT NULL REFERENCES turns(id), day TEXT NOT NULL, item TEXT NOT NULL);
   CREATE TABLE uses (
     id INTEGER PRIMARY KEY, turn_id INTEGER NOT NULL REFERENCES turns(id), day TEXT NOT NULL,
     item TEXT NOT NULL, correct INTEGER NOT NULL);
   CREATE INDEX uses_item ON uses(item, day);
   CREATE TABLE sessions (
     day TEXT PRIMARY KEY, started_at TEXT NOT NULL, last_at TEXT NOT NULL,
     active_seconds REAL NOT NULL DEFAULT 0, graded_at TEXT, used_well INTEGER, topic TEXT,
     accuracy REAL, understanding REAL, jp_attempts INTEGER, fixes_count INTEGER, asked_count INTEGER);
   CREATE TABLE evidence (
     item TEXT NOT NULL, day TEXT NOT NULL, correct INTEGER NOT NULL, wrong INTEGER NOT NULL,
     PRIMARY KEY (item, day));
   CREATE TABLE memory (id INTEGER PRIMARY KEY, kind TEXT NOT NULL CHECK (kind IN ('fact','topic')), text TEXT NOT NULL, day TEXT NOT NULL);
   CREATE TABLE plans (day TEXT PRIMARY KEY, targets_json TEXT NOT NULL, plan_text TEXT NOT NULL, created_at TEXT NOT NULL);
   CREATE TABLE jobs (
     id INTEGER PRIMARY KEY, kind TEXT NOT NULL, day TEXT NOT NULL, status TEXT NOT NULL,
     attempts INTEGER NOT NULL DEFAULT 0, error TEXT, updated_at TEXT NOT NULL, UNIQUE (kind, day));
   CREATE TABLE own_items (id TEXT PRIMARY KEY, form TEXT NOT NULL, reading TEXT, meaning TEXT, first_day TEXT NOT NULL);`,
];

/** Opens the database and runs forward-only migrations. ":memory:" for tests. */
export function openDb(file: string): DB {
  if (file !== ":memory:") fs.mkdirSync(path.dirname(file), { recursive: true });
  const db = new Database(file);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  const version = db.pragma("user_version", { simple: true }) as number;
  for (let v = version; v < MIGRATIONS.length; v++) {
    db.transaction(() => {
      db.exec(MIGRATIONS[v]!);
      db.pragma(`user_version = ${v + 1}`);
    })();
  }
  return db;
}
