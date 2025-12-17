import { NextResponse, type NextRequest } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import { verifyUser } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // 1. Verifikasi User
  const auth = await verifyUser(request);
  if (!auth.isAuthenticated || !auth.userId) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const donationId = params.id;

  try {
    // ---------------------------------------------------------
    // QUERY 1: Ambil Data Utama Donasi
    // ---------------------------------------------------------
    const { data: rawData, error } = await supabase
      .from('donasi')
      .select(`
        *,
        kegiatan ( id_kegiatan, nama_program, url_poster ),
        donatur!inner ( 
            id_user,
            no_telp,
            user ( nama, email ) 
        ),
        admin ( 
            user ( nama ) 
        )
      `)
      .eq('id_donasi', donationId)
      .eq('donatur.id_user', auth.userId) 
      .limit(1)        // <--- PERBAIKAN 1: Pastikan cuma ambil 1
      .maybeSingle();  // <--- PERBAIKAN 2: Pakai maybeSingle biar gak crash kalo data double/kosong

    if (error) {
        console.error("DB Error (Main Data):", error.message);
        throw error;
    }

    if (!rawData) {
      return NextResponse.json({ message: 'Donasi tidak ditemukan' }, { status: 404 });
    }

    const d = rawData as any;
    const unwrap = (val: any) => (Array.isArray(val) ? val[0] : val) || null;

    // ---------------------------------------------------------
    // QUERY 2: Ambil Jadwal Penjemputan (UPDATED)
    // ---------------------------------------------------------
    let jadwalData = null;
    
    if (d.jenis_donasi === 'Barang') {
        const { data: jadwalRes, error: jadwalError } = await supabase
            .from('jadwal_penjemputan')
            .select('status_penjemputan, alamat_penjemputan, tanggal_penjemputan, jam_penjemputan')
            .eq('id_donasi', donationId)
            .limit(1)       // <--- PERBAIKAN 3: Kunci ini. Kalo ada history jadwal, ambil 1 saja.
            .maybeSingle(); // <--- PERBAIKAN 4: Ubah single() jadi maybeSingle()
        
        // Log error tapi jangan bikin 500 (opsional, biar aplikasi tetep jalan walau jadwal error)
        if (jadwalError) {
             console.warn("DB Error (Jadwal):", jadwalError.message);
        } else if (jadwalRes) {
            jadwalData = jadwalRes;
        }
    }

    // ---------------------------------------------------------
    // 3. Format Data Akhir
    // ---------------------------------------------------------
    const kegiatan = unwrap(d.kegiatan);
    const donaturRel = unwrap(d.donatur);
    const adminRel = unwrap(d.admin);
    
    const userDonatur = donaturRel ? unwrap(donaturRel.user) : null;
    const userAdmin = adminRel ? unwrap(adminRel.user) : null;

    const formattedData = {
        id_donasi: d.id_donasi,
        id_kegiatan: d.id_kegiatan,
        created_at: d.created_at,
        jenis_donasi: d.jenis_donasi,
        nominal: d.nominal,
        nama_barang: d.nama_barang,
        deskripsi_barang: d.deskripsi_barang,
        status: d.status,
        rejection_reason: d.rejection_reason,
        metode_pengiriman: d.metode_pengiriman,
        nomor_resi: d.nomor_resi,
        
        nama_program: kegiatan?.nama_program || 'Program Tidak Diketahui',
        url_poster: kegiatan?.url_poster || null,
        
        nama_donatur: userDonatur?.nama || 'Tanpa Nama',
        email_donatur: userDonatur?.email || '-',
        phone_donatur: donaturRel?.no_telp || '-',
        
        nama_verifikator: userAdmin?.nama || 'Pengurus Yayasan',
        
        jadwal: jadwalData ? {
            status_penjemputan: jadwalData.status_penjemputan || 'Dijadwalkan',
            alamat_penjemputan: jadwalData.alamat_penjemputan || '-',
            tanggal_penjemputan: jadwalData.tanggal_penjemputan || null,
            jam_penjemputan: jadwalData.jam_penjemputan || null
        } : null
    };

    return NextResponse.json(formattedData, { status: 200 });

  } catch (error: any) {
    console.error('[HISTORY_DETAIL_BY_ID] Error:', error.message);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}