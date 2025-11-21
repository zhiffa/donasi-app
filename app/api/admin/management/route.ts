import { NextResponse, type NextRequest } from 'next/server';
import { supabase } from '@/lib/supabaseClient'; // Ganti db dengan supabase
import { verifyAdmin } from '@/lib/auth';

// --- FUNGSI GET (Mengambil semua donasi untuk manajemen, dengan filter) ---
export async function GET(request: NextRequest) {
  const auth = await verifyAdmin(request);
  
  if (!auth.isAdmin) {
    return auth.response;
  }
  if (auth.jabatan !== 'Admin Operasional') {
    return NextResponse.json({ message: 'Akses ditolak: Hanya Admin Operasional' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status') || null;
  const programId = searchParams.get('program') ? parseInt(searchParams.get('program')!, 10) : null;
  const search = searchParams.get('search') || null;

  try {
    // --- PERUBAHAN BESAR ---
    // Menggunakan Fungsi Postgres (RPC) untuk kueri JOIN dan FILTER dinamis
    // Anda harus membuat fungsi 'get_donations_admin' ini di Supabase SQL Editor
    
    const { data: donations, error } = await supabase
      .rpc('get_donations_admin', {
         p_status: status,
         p_program_id: programId,
         p_search: search
      });
      
    if (error) throw error;
    // --- AKHIR PERUBAHAN ---
    
    return NextResponse.json(donations, { status: 200 });
  } catch (error) {
    console.error('[MANAGEMENT_GET]', error);
    return NextResponse.json(
      { message: 'Internal Server Error' },
      { status: 500 }
    );
  }
}