import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Paksa agar tidak dicache (selalu ambil data terbaru)
export const dynamic = 'force-dynamic';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY!;

const supabaseAdmin = createClient(supabaseUrl, supabaseKey);

export async function GET(
  request: Request,
  { params }: { params: { programId: string } }
) {
  const programId = params.programId;

  try {
    // --- PERBAIKAN QUERY DISINI ---
    // Kita ambil nama user MELALUI tabel 'donatur', bukan langsung ke user.
    const { data, error } = await supabaseAdmin
      .from('donasi')
      .select(`
        id_donasi, 
        nominal, 
        nama_barang, 
        deskripsi_barang, 
        jenis_donasi, 
        anonim, 
        created_at, 
        status,
        donatur (
          user (
            nama
          )
        )
      `)
      .eq('id_kegiatan', parseInt(programId))
      .eq('status', 'Diterima') // Pastikan status ini sesuai (huruf besar 'D')
      .order('created_at', { ascending: false });

    if (error) {
      console.error("Supabase Error Full:", error); // Cek terminal VSCode jika masih error
      throw error;
    }

    // Mapping data agar sesuai dengan tampilan frontend
    const publicDonations = (data || []).map((d: any) => {
      let displayNama = 'Hamba Allah';
      
      // Cek apakah donatur tidak anonim DAN datanya ada
      // d.donatur?.user?.nama -> cara akses data yang bersarang
      if (!d.anonim && d.donatur?.user?.nama) {
        displayNama = d.donatur.user.nama;
      }

      return {
        id: d.id_donasi,
        nama: displayNama,
        nominal: d.nominal,
        nama_barang: d.nama_barang,
        deskripsi_barang: d.deskripsi_barang, 
        jenis: d.jenis_donasi, 
        tanggal: d.created_at,
        status: d.status
      };
    });

    return NextResponse.json(publicDonations, { status: 200 });
  } catch (error: any) {
    console.error('[PUBLIC_DONATIONS_ERROR]', error.message);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}