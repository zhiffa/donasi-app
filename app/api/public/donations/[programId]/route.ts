import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

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
    // 1. Tambahkan deskripsi_barang ke dalam select query
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
        user (nama)
      `)
      .eq('id_kegiatan', parseInt(programId))
      .eq('status', 'Diterima') 
      .order('created_at', { ascending: false });

    if (error) throw error;

    const publicDonations = (data || []).map(d => {
      let displayNama = 'Hamba Allah';
      
      if (!d.anonim && d.user && (d.user as any).nama) {
        displayNama = (d.user as any).nama;
      }

      return {
        id: d.id_donasi,
        nama: displayNama,
        nominal: d.nominal,
        nama_barang: d.nama_barang,
        deskripsi_barang: d.deskripsi_barang, // Pastikan mengambil kolom deskripsi_barang
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