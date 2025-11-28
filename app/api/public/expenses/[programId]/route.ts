import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

export async function GET(
  request: Request,
  { params }: { params: { programId: string } }
) {
  const programId = params.programId;

  try {
    // Kita pilih kolom secara eksplisit untuk menghindari error tipe data tak terduga
    const { data, error } = await supabaseAdmin
      .from('pengeluaran')
      .select('id_pengeluaran, deskripsi, nominal, item_details, type, tanggal, id_kegiatan')
      .eq('id_kegiatan', parseInt(programId))
      .order('tanggal', { ascending: false });

    if (error) throw error;

    return NextResponse.json(data || [], { status: 200 }); // Pastikan return array kosong jika null

  } catch (error: any) {
    console.error('[PUBLIC_EXPENSES_GET] Error:', error.message);
    return NextResponse.json({ message: 'Error fetching expenses' }, { status: 500 });
  }
}