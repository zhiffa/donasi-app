import { NextResponse, type NextRequest } from 'next/server';
import { supabase } from '@/lib/supabaseClient'; 
import { verifyAdmin } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const auth = await verifyAdmin(request);

  if (!auth.isAdmin) {
    return auth.response;
  }
  if (auth.jabatan !== 'Admin Operasional') {
    return NextResponse.json({ message: 'Akses ditolak: Hanya Admin Operasional' }, { status: 403 });
  }

  try {
    // --- PERUBAHAN: Tambahkan 'metode_pembayaran' di select ---
    const { data, error } = await supabase
      .from('donasi')
      .select(`
        id_donasi,
        jenis_donasi,
        status,
        created_at,
        nominal,
        nama_barang,
        metode_pembayaran, 
        donatur ( user ( nama ) )
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    
    const donations = (data as any[]).map(d => {
        const donaturObj = Array.isArray(d.donatur) ? d.donatur[0] : d.donatur;
        const userObj = donaturObj && Array.isArray(donaturObj.user) ? donaturObj.user[0] : donaturObj?.user;

        return {
            ...d,
            nama_donatur: userObj?.nama || 'Tanpa Nama',
            donatur: undefined 
        };
    });
    
    return NextResponse.json(donations, { status: 200 });
  } catch (error) {
    console.error('[VERIFICATION_GET]', error);
    return NextResponse.json(
      { message: 'Internal Server Error' },
      { status: 500 }
    );
  }
}