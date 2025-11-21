import { NextResponse, type NextRequest } from 'next/server';
import { supabase } from '@/lib/supabaseClient'; // Ganti db dengan supabase
import { verifyUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
  // 1. Verifikasi user
  const auth = await verifyUser(request);
  if (!auth.isAuthenticated || !auth.userId) {
    return NextResponse.json({ message: 'Akses ditolak: Anda harus login' }, { status: 401 });
  }

  try {
    // 2. Dapatkan id_donatur dari id_user
    const { data: donaturData, error: donaturError } = await supabase
      .from('donatur')
      .select('id_donatur')
      .eq('id_user', auth.userId)
      .single();

    if (donaturError || !donaturData) {
      return NextResponse.json({ message: 'Data donatur tidak ditemukan' }, { status: 404 });
    }

    // 3. Ambil riwayat donasi
    // Join dengan tabel kegiatan untuk dapat nama_program
    const { data: history, error } = await supabase
      .from('donasi')
      .select(`
        id_donasi,
        tanggal_donasi,
        jenis_donasi,
        nominal,
        nama_barang,
        status,
        kegiatan ( nama_program )
      `)
      .eq('id_donatur', donaturData.id_donatur)
      .order('tanggal_donasi', { ascending: false });

    if (error) throw error;

    // Ratakan data (flatten) agar sesuai format frontend
    const formattedHistory = history.map((item: any) => ({
      ...item,
      nama_program: item.kegiatan?.nama_program,
      kegiatan: undefined
    }));

    return NextResponse.json(formattedHistory, { status: 200 });

  } catch (error) {
    console.error('[DONATION_HISTORY_GET]', error);
    return NextResponse.json(
      { message: 'Internal Server Error' },
      { status: 500 }
    );
  }
}