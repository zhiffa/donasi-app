import { createClient } from '@supabase/supabase-js'

// 1. Ambil URL dan Kunci dari file .env.local Anda
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase URL or Anon Key is missing in .env.local');
}

// 2. Buat dan ekspor klien Supabase
// Kita menggunakan 'service_role' di backend untuk bypass RLS (jika ada)
// Untuk keamanan yang lebih ketat, gunakan 'anon' key dan atur RLS.
// Tapi untuk migrasi langsung, service key lebih mudah.
// Ganti ini jika Anda ingin menggunakan RLS dari sisi server.
const supabaseAdmin = createClient(supabaseUrl, process.env.SUPABASE_SERVICE_KEY || supabaseAnonKey);

export const supabase = supabaseAdmin;