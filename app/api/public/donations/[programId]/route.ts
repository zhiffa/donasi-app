import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

// --- PERBAIKAN: MATIKAN CACHE AGAR DATA SELALU FRESH ---
export const dynamic = 'force-dynamic'; 
// -------------------------------------------------------

// API Publik: Mengambil daftar donasi yang DITERIMA untuk program tertentu
export async function GET(
  request: Request,
  { params }: { params: { programId: string } }
) {
  const programId = params.programId;

  try {
    const { data, error } = await supabase
      .from('donasi')
      .select(`
        id_donasi,
        nominal,
        nama_barang,
        jenis_donasi,
        anonim,
        created_at,
        donatur ( user ( nama ) )
      `)
      .eq('id_kegiatan', parseInt(programId))
      .eq('status', 'Diterima') // Pastikan status di DB persis 'Diterima' (Huruf besar D)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Format data untuk menyamarkan nama jika anonim
    const publicDonations = (data as any[]).map(d => {
        // Handle array/object dari join
        const donaturObj = Array.isArray(d.donatur) ? d.donatur[0] : d.donatur;
        const userObj = donaturObj && Array.isArray(donaturObj.user) ? donaturObj.user[0] : donaturObj?.user;
        
        return {
            id: d.id_donasi,
            nama: d.anonim ? 'Hamba Allah' : (userObj?.nama || 'Donatur'),
            nominal: d.nominal,
            barang: d.nama_barang,
            jenis: d.jenis_donasi,
            tanggal: d.created_at
        };
    });

    return NextResponse.json(publicDonations, { status: 200 });
  } catch (error) {
    console.error('[PUBLIC_DONATIONS_GET]', error);
    return NextResponse.json({ message: 'Error fetching donations' }, { status: 500 });
  }
}