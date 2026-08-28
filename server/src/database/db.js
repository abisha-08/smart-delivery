const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
const { seedDatabase } = require('./seed');

const dbPath = path.resolve(__dirname, '../../ups_logistics.db');
const schemaPath = path.resolve(__dirname, 'schema.sql');

let db;

function getDb() {
  if (!db) {
    db = new Database(dbPath);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');

    // Run schema
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    db.exec(schemaSql);

    // Check if initial seeding is needed
    const count = db.prepare('SELECT COUNT(*) as count FROM shipments').get();
    if (count.count === 0) {
      console.log('Database is empty, initializing seed data...');
      seedDatabase(db);
    }
  }
  return db;
}

function resetDatabase() {
  const database = getDb();
  seedDatabase(database);
  return { success: true, message: 'Database successfully reset to initial seed state.' };
}

module.exports = {
  getDb,
  resetDatabase
};
