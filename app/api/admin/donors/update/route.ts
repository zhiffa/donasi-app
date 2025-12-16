import { NextResponse, type NextRequest } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import { verifyAdmin } from '@/lib/auth';

export async function PATCH(request: NextRequest) {
  const auth = await verifyAdmin(request);
  if (!auth.isAdmin) return auth.response;

  try {
    const body = await request.json();
    const { id_donatur, no_telp } = body;

    if (!id_donatur || !no_telp) {
        return NextResponse.json({ message: 'Data tidak lengkap' }, { status: 400 });
    }

    // Update tabel donatur
    const { error } = await supabase
        .from('donatur')
        .update({ no_telp: no_telp })
        .eq('id_donatur', id_donatur);

    if (error) throw error;

    return NextResponse.json({ message: 'Nomor telepon berhasil diupdate' }, { status: 200 });
  } catch (error) {
    console.error('[UPDATE_PHONE]', error);
    return NextResponse.json({ message: 'Gagal update data' }, { status: 500 });
  }
}