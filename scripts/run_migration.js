const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const connectionString = 'postgres://postgres:AcUaccQBlhR73vuM@db.lrinsdsqsuafffzwqryk.supabase.co:5432/postgres';

async function runMigration() {
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('Connected to database.');
    
    const migrationPath = path.join(__dirname, '../supabase/migration_simulation_results.sql');
    const sql = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('Running migration...');
    await client.query(sql);
    console.log('Migration executed successfully.');
    
    // In Supabase we might need to notify PostgREST to reload schema cache
    try {
      await client.query('NOTIFY pgrst, \'reload schema\';');
      console.log('Notified PostgREST to reload schema cache.');
    } catch (e) {
      console.warn('Could not notify PostgREST:', e.message);
    }

  } catch (error) {
    console.error('Error executing migration:', error);
  } finally {
    await client.end();
  }
}

runMigration();
