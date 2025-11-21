import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
export const dynamic = 'force-dynamic'; 
// API Publik: Mengambil daftar pengeluaran untuk program tertentu
export async function GET(
  request: Request,
  { params }: { params: { programId: string } }
) {
  const programId = params.programId;

  try {
    const { data, error } = await supabase
      .from('pengeluaran')
      .select('*')
      .eq('id_kegiatan', parseInt(programId))
      .order('tanggal', { ascending: false });

    if (error) throw error;

    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error('[PUBLIC_EXPENSES_GET]', error);
    return NextResponse.json({ message: 'Error fetching expenses' }, { status: 500 });
  }
}