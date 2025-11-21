import { NextResponse, type NextRequest } from 'next/server'; // <-- PERBAIKAN 1: Tambah NextRequest
import { supabase } from '@/lib/supabaseClient'; 
import { verifyAdmin } from '@/lib/auth';

// --- FUNGSI GET (Mengambil semua donasi untuk verifikasi) ---
export async function GET(request: NextRequest) { // <-- PERBAIKAN 2: Ganti Request ke NextRequest
  const auth = await verifyAdmin(request);

  if (!auth.isAdmin) {
    return auth.response;
  }
  if (auth.jabatan !== 'Admin Operasional') {
    return NextResponse.json({ message: 'Akses ditolak: Hanya Admin Operasional' }, { status: 403 });
  }

  try {
    // --- PERUBAHAN KE SUPABASE ---
    const { data, error } = await supabase
      .from('donasi')
      .select(`
        id_donasi,
        jenis_donasi,
        status,
        created_at,
        nominal,
        nama_barang,
        donatur ( user ( nama ) )
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    
    // Ratakan (flatten) data agar sesuai output lama
    // <-- PERBAIKAN 3: Casting ke 'any[]' untuk menghindari error TypeScript pada nested object
    const donations = (data as any[]).map(d => {
        // Handle kemungkinan donatur/user dikembalikan sebagai array oleh Supabase
        const donaturObj = Array.isArray(d.donatur) ? d.donatur[0] : d.donatur;
        const userObj = donaturObj && Array.isArray(donaturObj.user) ? donaturObj.user[0] : donaturObj?.user;

        return {
            ...d,
            nama_donatur: userObj?.nama || 'Tanpa Nama',
            donatur: undefined // Hapus data nested
        };
    });
    // --- AKHIR PERUBAHAN ---
    
    return NextResponse.json(donations, { status: 200 });
  } catch (error) {
    console.error('[VERIFICATION_GET]', error);
    return NextResponse.json(
      { message: 'Internal Server Error' },
      { status: 500 }
    );
  }
}