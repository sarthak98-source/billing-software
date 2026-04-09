/**
 * db.ts — Simple file-based JSON database
 * Reads and writes to data/db.json
 * No external database required — perfect for local/small deployments
 */

import fs from 'fs';
import path from 'path';
import type { DB } from './types/index';

const DB_DIR  = path.join(__dirname, '..', 'data');
const DB_FILE = path.join(DB_DIR, 'db.json');

const EMPTY_DB: DB = {
  users: [],
  products: [],
  bills: [],
};

/** Ensure data directory and db file exist */
function ensureDB(): void {
  if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
  }
  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify(EMPTY_DB, null, 2), 'utf-8');
  }
}

/** Read the entire database */
export function readDB(): DB {
  ensureDB();
  try {
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    return JSON.parse(raw) as DB;
  } catch {
    return { ...EMPTY_DB };
  }
}

/** Write the entire database */
export function writeDB(db: DB): void {
  ensureDB();
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
}
