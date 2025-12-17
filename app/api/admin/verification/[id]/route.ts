import { NextResponse, type NextRequest } from 'next/server';
import { supabase } from '@/lib/supabaseClient'; 
import { verifyAdmin } from '@/lib/auth';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await verifyAdmin(request);
  
  if (!auth.isAdmin || !auth.userId) {
    return auth.response;
  }
  
  // LOGIC BARU: Izinkan jika Admin Operasional ATAU Super Admin
  if (auth.jabatan !== 'Admin Operasional' && auth.jabatan !== 'Super Admin') {
    return NextResponse.json({ message: 'Akses ditolak: Hanya Admin Operasional' }, { status: 403 });
  }

  const donationId = params.id;
  
  // 1. Ambil ID Admin
  let adminId;
  try {
    const { data: adminData, error: adminError } = await supabase
      .from('admin')
      .select('id_admin')
      .eq('id_user', auth.userId)
      .single();
      
    if (adminError || !adminData) throw new Error('Data admin tidak ditemukan');
    adminId = adminData.id_admin;
  } catch (dbError) {
     return NextResponse.json({ message: 'Gagal memverifikasi admin' }, { status: 500 });
  }

  // 2. Ambil Data Body
  const { status, reason } = await request.json(); 

  if (!status) {
      return NextResponse.json({ message: 'Status harus diisi' }, { status: 400 });
  }
  if (status === 'Ditolak' && !reason) {
      return NextResponse.json({ message: 'Alasan penolakan wajib diisi agar donatur tahu.' }, { status: 400 });
  }

  try {
    // 3. Update Database
    const updateData = {
      status: status,
      id_admin_verifikasi: adminId,
      rejection_reason: status === 'Diterima' ? null : reason, // Hapus alasan jika diterima
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('donasi')
      .update(updateData)
      .eq('id_donasi', donationId)
      // Kita izinkan update ulang jika status sebelumnya bukan 'Diterima' (misal revisi penolakan), 
      // atau tetapkan rule hanya bisa update yang 'Pending'. Di sini saya set 'Pending' agar aman.
      .eq('status', 'Pending') 
      .select();

    if (error) throw error;

    if (!data || data.length === 0) {
      return NextResponse.json(
        { message: 'Donasi tidak ditemukan atau sudah diverifikasi sebelumnya.' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      { message: `Donasi berhasil diperbarui menjadi ${status}` },
      { status: 200 }
    );

  } catch (error) {
    console.error('[VERIFY_PATCH]', error);
    return NextResponse.json(
      { message: 'Internal Server Error' },
      { status: 500 }
    );
  }
}