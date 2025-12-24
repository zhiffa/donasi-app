import { NextResponse, type NextRequest } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import { verifyUser } from '@/lib/auth';

// Force dynamic agar tidak di-cache oleh Next.js (penting untuk data realtime)
export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { programId: string } }
) {
  // 1. Cek Auth User
  const auth = await verifyUser(request);
  if (!auth.isAuthenticated || !auth.userId) {
    return NextResponse.json({ message: 'Anda harus login' }, { status: 401 });
  }

  const programId = params.programId;

  try {
    // 2. Query Donasi Spesifik User & Program Ini
    // Menggunakan !inner pada donatur untuk memfilter berdasarkan user yang login
    const { data, error } = await supabase
      .from('donasi')
      .select(`
        *,
        donatur!inner ( id_user ),
        jadwal_penjemputan (
            status_penjemputan,
            tanggal_penjemputan,
            jam_penjemputan
        )
      `)
      .eq('donatur.id_user', auth.userId)       // Filter user yang login
      .eq('id_kegiatan', parseInt(programId))   // Filter program yang sedang dibuka
      .order('created_at', { ascending: false }) // Ambil yang paling baru
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error('[HISTORY_QUERY_ERROR]', error);
      throw error;
    }

    // 3. Handle Jika Belum Ada Donasi (Return 200 dengan null, agar tidak dianggap Error di Console)
    if (!data) {
      // Kita kembalikan status 200 tapi datanya null. 
      // Ini lebih aman daripada 404 agar console browser tidak merah jika user memang belum donasi.
      return NextResponse.json(null, { status: 200 }); 
    }

    // 4. Perapihan Data (Flattening)
    // Ambil object jadwal (karena relasi one-to-one/one-to-many bisa return array)
    const jadwalData = Array.isArray(data.jadwal_penjemputan) 
        ? data.jadwal_penjemputan[0] 
        : data.jadwal_penjemputan;

    // Hapus properti nested yang tidak perlu dikirim ke frontend
    const { donatur, jadwal_penjemputan, ...donationData } = data;

    // Gabungkan jadwal ke level utama response
    const finalData = {
        ...donationData,
        jadwal: jadwalData || null
    };

    return NextResponse.json(finalData, { status: 200 });

  } catch (error: any) {
    console.error('[HISTORY_DETAIL_GET]', error);
    return NextResponse.json(
      { message: 'Internal Server Error: ' + error.message },
      { status: 500 }
    );
  }
}