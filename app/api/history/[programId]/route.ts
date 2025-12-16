import { NextResponse, type NextRequest } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import { verifyUser } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: { programId: string } }
) {
  const auth = await verifyUser(request);
  if (!auth.isAuthenticated || !auth.userId) {
    return NextResponse.json({ message: 'Anda harus login' }, { status: 401 });
  }

  const programId = params.programId;

  try {
    // Ambil satu donasi terbaru user ini untuk program tertentu
    // UPDATE: Tambahkan jadwal_penjemputan agar MyDonationStatus bisa menampilkan tracking
    const { data, error } = await supabase
      .from('donasi')
      .select(`
        *,
        donatur!inner ( id_user ),
        jadwal_penjemputan (
            status_penjemputan
        )
      `)
      .eq('donatur.id_user', auth.userId)
      .eq('id_kegiatan', parseInt(programId))
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw error;

    if (!data) {
      return NextResponse.json({ message: 'Donasi tidak ditemukan' }, { status: 404 });
    }

    // Handle jadwal (array/object)
    const jadwalData = Array.isArray(data.jadwal_penjemputan) 
        ? data.jadwal_penjemputan[0] 
        : data.jadwal_penjemputan;

    // Hapus data nested donatur sebelum dikirim
    const { donatur, jadwal_penjemputan, ...donationData } = data;

    // Gabungkan jadwal ke response utama
    const finalData = {
        ...donationData,
        jadwal: jadwalData || null
    };

    return NextResponse.json(finalData, { status: 200 });

  } catch (error) {
    console.error('[HISTORY_DETAIL_GET]', error);
    return NextResponse.json(
      { message: 'Internal Server Error' },
      { status: 500 }
    );
  }
}