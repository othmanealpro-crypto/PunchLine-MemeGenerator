import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import Database from 'better-sqlite3';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

// STORAGE_DIR permet de pointer vers un disque persistant une fois déployé.
export const STORAGE_DIR = process.env.STORAGE_DIR || path.join(rootDir, 'storage');
export const MEMES_DIR = path.join(STORAGE_DIR, 'memes');

fs.mkdirSync(MEMES_DIR, { recursive: true });

export const db = new Database(path.join(STORAGE_DIR, 'memes.db'));

db.exec(`
  CREATE TABLE IF NOT EXISTS memes (
    id           TEXT PRIMARY KEY,
    filename     TEXT NOT NULL,
    caption      TEXT NOT NULL DEFAULT '',
    delete_token TEXT NOT NULL,
    created_at   TEXT NOT NULL
  )
`);
