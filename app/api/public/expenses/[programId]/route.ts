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
  const programId = Number(params.programId); 

  // Validasi jika bukan angka, langsung return kosong
  if (isNaN(programId)) {
    return NextResponse.json([], { status: 200 });
  }

  try {
    const { data, error } = await supabaseAdmin
      .from('pengeluaran')
      .select('*')
      .eq('id_kegiatan', programId) // Sekarang membandingkan Integer vs Integer
      .order('tanggal', { ascending: false });

    if (error) throw error;

    return NextResponse.json(data || [], { 
      status: 200,
      headers: { 'Cache-Control': 'no-store' } 
    });

  } catch (error: any) {
    console.error('Error:', error.message);
    return NextResponse.json({ message: 'Error' }, { status: 500 });
  }
}
