import { NextResponse, type NextRequest } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import { verifyUser } from '@/lib/auth';

export async function PATCH(request: NextRequest) {
  const auth = await verifyUser(request);
  if (!auth.isAuthenticated || !auth.userId) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { donationId, resi } = await request.json();

    if (!donationId || !resi) {
        return NextResponse.json({ message: 'Data tidak lengkap' }, { status: 400 });
    }

    // 1. Validasi Kepemilikan (Cek id_donatur user ini)
    const { data: donatur } = await supabase.from('donatur').select('id_donatur').eq('id_user', auth.userId).single();
    if (!donatur) return NextResponse.json({ message: 'Donatur not found' }, { status: 404 });

    // 2. Update Resi
    const { error } = await supabase
        .from('donasi')
        .update({ nomor_resi: resi })
        .eq('id_donasi', donationId)
        .eq('id_donatur', donatur.id_donatur); // Pastikan hanya bisa update donasi sendiri

    if (error) throw error;

    return NextResponse.json({ message: 'Resi berhasil disimpan' }, { status: 200 });

  } catch (error: any) {
    console.error('[UPDATE_RESI]', error);
    return NextResponse.json({ message: 'Error updating resi' }, { status: 500 });
  }
}