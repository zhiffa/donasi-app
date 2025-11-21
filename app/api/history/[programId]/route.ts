import { NextResponse, type NextRequest } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import { verifyUser } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: { programId: string } }
) {
  const auth = await verifyUser(request);
  if (!auth.isAuthenticated || !auth.userId) {
    return NextResponse.json({ message: 'Anda harus login' }, { status: 401 });
  }

  const programId = params.programId;

  try {
    // Ambil satu donasi terbaru user ini untuk program tertentu
    const { data, error } = await supabase
      .from('donasi')
      .select(`
        *,
        donatur!inner ( id_user ) 
      `)
      .eq('donatur.id_user', auth.userId)
      .eq('id_kegiatan', parseInt(programId))
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw error;

    if (!data) {
      return NextResponse.json({ message: 'Donasi tidak ditemukan' }, { status: 404 });
    }

    // Hapus data nested donatur sebelum dikirim
    const { donatur, ...donationData } = data;

    return NextResponse.json(donationData, { status: 200 });

  } catch (error) {
    console.error('[HISTORY_DETAIL_GET]', error);
    return NextResponse.json(
      { message: 'Internal Server Error' },
      { status: 500 }
    );
  }
}