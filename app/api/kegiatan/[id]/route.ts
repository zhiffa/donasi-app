// File: app/api/kegiatan/[id]/route.ts

import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient'; // Ganti db dengan supabase

export async function GET(
  request: Request,
  { params }: { params: { id: string } } // 'id' ini adalah 'id_kegiatan'
) {
  try {
    const programId = params.id;

    if (!programId || isNaN(Number(programId))) {
      return NextResponse.json({ message: 'ID Kegiatan tidak valid' }, { status: 400 });
    }

    // --- PERUBAHAN KE SUPABASE RPC ---
    // Memanggil fungsi 'get_kegiatan_details' yang sudah mencakup
    // logika JOIN, SUM, GROUP BY, dan cek status 'Aktif'
    const { data, error } = await supabase
      .rpc('get_kegiatan_details', { p_id: Number(programId) })
      .single(); // Harapkan satu baris atau null

    if (error) throw error;
    // --- AKHIR PERUBAHAN ---

    if (!data) {
      // Jika RPC tidak menemukan data (atau statusnya bukan 'Aktif')
      return NextResponse.json({ message: 'Program tidak ditemukan atau tidak aktif' }, { status: 404 });
    }
    
    // Sukses, kembalikan data program
    return NextResponse.json(data, { status: 200 });

  } catch (error) {
    console.error('[KEGIATAN_DETAIL_GET]', error); // Log error asli
    return NextResponse.json(
      { message: 'Internal Server Error' },
      { status: 500 }
    );
  }
}