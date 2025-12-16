import { NextResponse, type NextRequest } from 'next/server';
import { supabase } from '@/lib/supabaseClient'; 
import { verifyAdmin } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const auth = await verifyAdmin(request);

  if (!auth.isAdmin) return auth.response;
  if (auth.jabatan !== 'Admin Operasional') {
    return NextResponse.json({ message: 'Akses ditolak' }, { status: 403 });
  }

  try {
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
        metode_pengiriman,
        nomor_resi,
        rejection_reason,
        donatur ( user ( nama ) ),
        jadwal_penjemputan ( status_penjemputan )  // <--- TAMBAHAN JOIN
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    
    const donations = (data as any[]).map(d => {
        const donaturObj = Array.isArray(d.donatur) ? d.donatur[0] : d.donatur;
        const userObj = donaturObj && Array.isArray(donaturObj.user) ? donaturObj.user[0] : donaturObj?.user;
        
        // Ambil status penjemputan (karena relasi bisa array/object tergantung setup)
        const jadwalObj = Array.isArray(d.jadwal_penjemputan) ? d.jadwal_penjemputan[0] : d.jadwal_penjemputan;

        return {
            ...d,
            nama_donatur: userObj?.nama || 'Tanpa Nama',
            status_logistik: jadwalObj?.status_penjemputan || null, // <--- Mapping ke field baru
            donatur: undefined,
            jadwal_penjemputan: undefined
        };
    });
    
    return NextResponse.json(donations, { status: 200 });
  } catch (error) {
    console.error('[VERIFICATION_GET]', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}