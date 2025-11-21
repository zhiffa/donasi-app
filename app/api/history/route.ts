import { NextResponse, type NextRequest } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import { verifyUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const auth = await verifyUser(request);
  if (!auth.isAuthenticated || !auth.userId) {
    return NextResponse.json({ message: 'Anda harus login' }, { status: 401 });
  }

  try {
    // Query donasi milik user yang login
    // Kita gunakan donatur!inner join untuk filter berdasarkan auth.userId
    const { data: donations, error } = await supabase
      .from('donasi')
      .select(`
        *,
        kegiatan ( nama_program, url_poster ),
        donatur!inner ( id_user )
      `)
      .eq('donatur.id_user', auth.userId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    if (!donations || donations.length === 0) {
      return NextResponse.json([], { status: 200 });
    }

    // Ratakan data
    const formattedDonations = donations.map((d: any) => ({
        ...d,
        nama_program: d.kegiatan?.nama_program,
        url_poster: d.kegiatan?.url_poster,
        kegiatan: undefined,
        donatur: undefined
    }));

    return NextResponse.json(formattedDonations, { status: 200 });

  } catch (error) {
    console.error('[HISTORY_GET]', error);
    return NextResponse.json(
      { message: 'Internal Server Error' },
      { status: 500 }
    );
  }
}