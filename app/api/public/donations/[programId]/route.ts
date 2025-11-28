import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

// Pastikan variabel ini ada
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY!;

const supabaseAdmin = createClient(supabaseUrl, supabaseKey);

export async function GET(
  request: Request,
  { params }: { params: { programId: string } }
) {
  const programId = params.programId;

  try {
    // Versi Sederhana: Tanpa Join ke user/donatur dulu
    // Kita hanya ambil data tabel 'donasi'
    const { data, error } = await supabaseAdmin
      .from('donasi')
      .select('id_donasi, nominal, nama_barang, jenis_donasi, anonim, created_at, status')
      .eq('id_kegiatan', parseInt(programId))
      .eq('status', 'Diterima') // Pastikan D besar
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Mapping sederhana
    const publicDonations = (data || []).map(d => ({
        id: d.id_donasi,
        nama: d.anonim ? 'Hamba Allah' : 'Donatur', // Sementara hardcode dulu
        nominal: d.nominal,
        barang: d.nama_barang,
        jenis: d.jenis_donasi,
        tanggal: d.created_at
    }));

    return NextResponse.json(publicDonations, { status: 200 });
  } catch (error: any) {
    console.error('[PUBLIC_DONATIONS_ERROR]', error.message);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}