import { NextResponse, type NextRequest } from 'next/server'; // <-- PERBAIKAN: Tambahkan NextRequest
import { supabase } from '@/lib/supabaseClient'; 
import { verifyAdmin } from '@/lib/auth';

// --- FUNGSI PATCH (Menyetujui atau Menolak donasi) ---
export async function PATCH(
  request: NextRequest, // <-- PERBAIKAN: Ganti Request dengan NextRequest
  { params }: { params: { id: string } }
) {
  const auth = await verifyAdmin(request);
  
  if (!auth.isAdmin || !auth.userId) {
    return auth.response;
  }
  if (auth.jabatan !== 'Admin Operasional') {
    return NextResponse.json({ message: 'Akses ditolak: Hanya Admin Operasional' }, { status: 403 });
  }

  const donationId = params.id;
  
  let adminId;
  try {
    // --- PERUBAHAN KE SUPABASE ---
    const { data: adminData, error: adminError } = await supabase
      .from('admin')
      .select('id_admin')
      .eq('id_user', auth.userId)
      .single();
      
    if (adminError || !adminData) {
        throw new Error('Data admin tidak ditemukan');
    }
    adminId = adminData.id_admin;
    // --- AKHIR PERUBAHAN ---
  } catch (dbError) {
     console.error('[VERIFY_PATCH_ADMIN_QUERY]', dbError);
     return NextResponse.json({ message: 'Gagal memverifikasi admin' }, { status: 500 });
  }

  const { status, reason } = await request.json(); 

  if (!status || (status === 'Ditolak' && !reason)) {
      return NextResponse.json({ message: 'Status (dan alasan jika ditolak) harus diisi' }, { status: 400 });
  }
  if (status !== 'Diterima' && status !== 'Ditolak') {
     return NextResponse.json({ message: "Status tidak valid, harus 'Diterima' atau 'Ditolak'" }, { status: 400 });
  }
  if (!donationId) {
    return NextResponse.json({ message: 'ID Donasi dibutuhkan' }, { status: 400 });
  }

  try {
    // --- PERUBAHAN KE SUPABASE ---
    
    // Siapkan data untuk di-update
    const updateData = {
      status: status,
      id_admin_verifikasi: adminId,
      rejection_reason: status === 'Diterima' ? null : reason
    };

    // Eksekusi query update
    // Kita filter berdasarkan id_donasi DAN status 'Pending'
    // .select() di akhir akan mengembalikan data jika berhasil, atau array kosong jika tidak
    const { data, error } = await supabase
      .from('donasi')
      .update(updateData)
      .eq('id_donasi', donationId)
      .eq('status', 'Pending') // Hanya update jika status masih 'Pending'
      .select(); // Minta Supabase mengembalikan baris yang di-update

    if (error) throw error;

    // Cek apakah ada baris yang ter-update
    if (!data || data.length === 0) {
      return NextResponse.json(
        { message: 'Donasi tidak ditemukan atau statusnya bukan "Pending"' },
        { status: 404 }
      );
    }
    // --- AKHIR PERUBAHAN ---
    
    return NextResponse.json(
      { message: `Donasi berhasil di-update ke ${status}` },
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