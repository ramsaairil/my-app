/**
 * Supabase PostgreSQL Migration Runner Script
 * Usage: node scripts/migrate.js
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Load environment variables from .env.local or .env
require('dotenv').config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

async function runMigration() {
  console.log('----------------------------------------------------');
  console.log('🚀 Supabase PostgreSQL Migration Runner');
  console.log('----------------------------------------------------');

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ ERROR: Key Supabase belum dikonfigurasi!');
    console.error('Silakan isi NEXT_PUBLIC_SUPABASE_URL dan NEXT_PUBLIC_SUPABASE_ANON_KEY di file .env.local\n');
    console.log('Panduan Singkat Migrasi Manual:');
    console.log('1. Buka dashboard Supabase: https://supabase.com/dashboard');
    console.log('2. Masuk ke menu "SQL Editor"');
    console.log('3. Buka dan Salin isi file: supabase/schema.sql');
    console.log('4. Tempel di SQL Editor lalu klik "Run"\n');
    process.exit(1);
  }

  const sqlPath = path.resolve(process.cwd(), 'supabase', 'schema.sql');
  const sqlContent = fs.readFileSync(sqlPath, 'utf8');

  console.log(`📄 Membaca file skema SQL: ${sqlPath}`);
  console.log(`📡 Menghubungkan ke Supabase URL: ${supabaseUrl}`);

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    // Try executing RPC if configured or test connection
    const { data, error } = await supabase.from('trucks').select('count', { count: 'exact', head: true });
    
    if (error && error.code === 'PGRST301') {
      console.log('⚠️ Tabel belum dibuat di PostgreSQL Supabase.');
    } else {
      console.log('✅ Koneksi ke PostgreSQL Supabase BERHASIL!');
    }

    console.log('\n----------------------------------------------------');
    console.log('📌 UNTUK MENJALANKAN STRUKTUR DDL FULL TABLE:');
    console.log('Salin & tempel seluruh isi file supabase/schema.sql ke Supabase SQL Editor:');
    console.log(`➡️  ${sqlPath}`);
    console.log('----------------------------------------------------');

  } catch (err) {
    console.error('❌ Terjadi kesalahan saat migrasi:', err.message);
  }
}

runMigration();
