/**
 * Database Connection Checker Script
 * Usage: node scripts/check-db.js
 */

const path = require('path');
require('dotenv').config({ path: path.resolve(process.cwd(), '.env.local') });
const { createClient } = require('@supabase/supabase-js');

async function testConnection() {
  console.log('====================================================');
  console.log('🔍 APPS LOGISTICS - DATABASE CONNECTION TEST');
  console.log('====================================================');

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

  console.log(`📌 Supabase URL : ${supabaseUrl || '(KOSONG / BELUM DIISI)'}`);
  console.log(`📌 Supabase Key : ${supabaseKey ? '(TERSEDIA / TEKS TERISI)' : '(KOSONG / BELUM DIISI)'}`);
  console.log('----------------------------------------------------');

  if (!supabaseUrl || !supabaseKey) {
    console.log('❌ STATUS: KONEKSI GAGAL');
    console.log('👉 ALASAN: File .env.local belum diisi dengan URL dan Anon Key dari Supabase.');
    console.log('\n💡 PETUNJUK:');
    console.log('1. Buka file: .env.local');
    console.log('2. Masukkan URL & Anon Key dari Supabase Dashboard (Project Settings > API)');
    console.log('====================================================');
    return;
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    console.log('⚡ Mengirim ping query SELECT ke PostgreSQL Supabase...');

    const { data, error } = await supabase.from('cargos').select('id').limit(1);

    if (error) {
      if (error.code === 'PGRST301' || error.message.includes('relation "public.cargos" does not exist')) {
        console.log('⚠️ STATUS: KONEKSI SUPABASE BERHASIL, TETAPI TABEL BELUM TERSEDIA!');
        console.log('👉 ALASAN: Tabel "cargos" belum dibuat di database PostgreSQL Supabase.');
        console.log('💡 PERBAIKAN: Jalankan file supabase/schema.sql pada SQL Editor Supabase.');
      } else {
        console.log('❌ STATUS: KONEKSI GAGAL');
        console.log(`👉 ERROR RESPONSE: ${error.message} (Code: ${error.code})`);
      }
    } else {
      console.log('✅ STATUS: KONEKSI KEDATABASE POSTGRESQL SUPABASE BERHASIL 100%!');
      console.log(`📊 Hasil Query: Berhasil merespons dengan data valid.`);
    }
  } catch (err) {
    console.log('❌ STATUS: KONEKSI GAGAL KARENA EXCEPTION');
    console.log(`👉 ERROR: ${err.message}`);
  }
  console.log('====================================================');
}

testConnection();
