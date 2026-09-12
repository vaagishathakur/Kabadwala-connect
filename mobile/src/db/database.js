import * as SQLite from 'expo-sqlite';
import { CREATE_TABLES_SQL } from './schema';

let db = null;

export const initDatabase = async () => {
  if (db) return db;
  
  db = await SQLite.openDatabaseAsync('kabadconnect.db');
  
  // Create tables
  for (const sql of CREATE_TABLES_SQL) {
    await db.execAsync(sql);
  }
  
  return db;
};

export const getDb = () => {
  if (!db) {
    throw new Error('Database not initialized');
  }
  return db;
};

export default {
  initDatabase,
  getDb
};
