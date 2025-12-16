import { NextResponse, type NextRequest } from 'next/server';
import { supabase } from '@/lib/supabaseClient'; 
import { verifyUser } from '@/lib/auth';

export async function GET(request: NextRequest) { 
  const auth = await verifyUser(request);
  if (!auth.isAuthenticated || !auth.userId) {
    return NextResponse.json({ message: 'Anda harus login' }, { status: 401 });
  }

  try {
    // QUERY RINGAN: Hanya ambil data donasi, kegiatan, dan donatur (untuk validasi)
    // HAPUS: jadwal_penjemputan
    const { data: donations, error } = await supabase
      .from('donasi')
      .select(`
        *,
        kegiatan ( nama_program, url_poster ),
        donatur!inner ( id_user )
      `)
      .eq('donatur.id_user', auth.userId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    if (!donations || donations.length === 0) {
      return NextResponse.json([], { status: 200 });
    }

    const formattedDonations = donations.map((d: any) => ({
        ...d,
        nama_program: d.kegiatan?.nama_program,
        url_poster: d.kegiatan?.url_poster,
        
        // Hapus properti nested
        kegiatan: undefined,
        donatur: undefined,
        // Tidak ada status_penjemputan di sini
    }));

    return NextResponse.json(formattedDonations, { status: 200 });

  } catch (error) {
    console.error('[HISTORY_GET]', error);
    return NextResponse.json(
      { message: 'Internal Server Error' },
      { status: 500 }
    );
  }
}