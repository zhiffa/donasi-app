// File: app/api/kegiatan/route.ts

import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient'; // Ganti db dengan supabase

export async function GET(request: Request) {
  try {
    // --- PERUBAHAN KE SUPABASE RPC ---
    // Memanggil fungsi 'get_active_kegiatan_list'
    // Fungsi ini sudah menghitung 'terkumpul' di dalam database
    // dan hanya mengambil kegiatan yang 'Aktif'
    const { data: programs, error } = await supabase
      .rpc('get_active_kegiatan_list');

    if (error) throw error;
    // --- AKHIR PERUBAHAN ---

    // Mengembalikan array (daftar) program
    return NextResponse.json(programs, { status: 200 });

  } catch (error) {
    // Log error jika UJI COBA ini pun gagal
    console.error('[KEGIATAN_LIST_GET]', error); 
    return NextResponse.json(
      { message: 'Internal Server Error' },
      { status: 500 }
    );
  }
}