import { NextResponse, type NextRequest } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import { verifyUser } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // 1. Verifikasi User
  const auth = await verifyUser(request);
  if (!auth.isAuthenticated || !auth.userId) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const donationId = params.id;

  try {
    // 2. Ambil detail donasi + Data Kegiatan + Data Admin Verifikator
    const { data, error } = await supabase
      .from('donasi')
      .select(`
        *,
        kegiatan ( id_kegiatan, nama_program, url_poster ),
        donatur!inner ( 
            id_user,
            user ( nama, email, phone ) 
        ),
        admin ( 
            user ( nama ) 
        )
      `)
      .eq('id_donasi', donationId)
      .eq('donatur.id_user', auth.userId) // Pastikan hanya pemilik donasi yang bisa lihat
      .single();

    if (error) throw error;

    if (!data) {
      return NextResponse.json({ message: 'Donasi tidak ditemukan' }, { status: 404 });
    }

    // 3. Format Data
    // Data admin/verifikator mungkin null jika belum diverifikasi atau ditolak sistem
    const adminName = Array.isArray(data.admin) 
        ? data.admin[0]?.user?.nama 
        : data.admin?.user?.nama;

    const formattedData = {
        ...data,
        nama_program: data.kegiatan?.nama_program,
        url_poster: data.kegiatan?.url_poster,
        nama_donatur: data.donatur?.user?.nama,
        email_donatur: data.donatur?.user?.email,
        phone_donatur: data.donatur?.user?.phone,
        nama_verifikator: adminName || 'Pengurus Yayasan', // Default jika null
        // Bersihkan nested objects
        kegiatan: undefined,
        donatur: undefined,
        admin: undefined
    };

    return NextResponse.json(formattedData, { status: 200 });

  } catch (error) {
    console.error('[HISTORY_DETAIL_BY_ID]', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}