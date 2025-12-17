import { NextResponse, type NextRequest } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import { verifyAdmin } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const auth = await verifyAdmin(request);
  
  if (!auth.isAdmin) return auth.response;

  // LOGIC BARU: Izinkan jika Admin Operasional ATAU Super Admin
  if (auth.jabatan !== 'Admin Operasional' && auth.jabatan !== 'Super Admin') {
    return NextResponse.json({ message: 'Akses ditolak: Hanya Admin Operasional' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status') || null;
  const programId = searchParams.get('program') ? parseInt(searchParams.get('program')!, 10) : null;
  const search = searchParams.get('search') || null;
  const jenisDonasi = searchParams.get('jenis') || null; // Ambil filter jenis

  try {
    const { data: donations, error } = await supabase
      .rpc('get_donations_admin', {
         p_status: status,
         p_program_id: programId,
         p_search: search,
         p_jenis_donasi: jenisDonasi
      });
      
    if (error) throw error;
    
    return NextResponse.json(donations, { status: 200 });
  } catch (error) {
    console.error('[MANAGEMENT_GET]', error);
    return NextResponse.json(
      { message: 'Internal Server Error' },
      { status: 500 }
    );
  }
}