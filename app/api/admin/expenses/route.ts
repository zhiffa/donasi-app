import { NextResponse, type NextRequest } from 'next/server'; // <-- PERBAIKAN: Impor NextRequest
import { supabase } from '@/lib/supabaseClient'; // Ganti db dengan supabase
import { verifyAdmin } from '@/lib/auth';

// --- 1. FUNGSI GET (Mengambil semua pengeluaran) ---
export async function GET(request: NextRequest) { 
  const auth = await verifyAdmin(request);
  
  if (!auth.isAdmin) {
    return auth.response;
  }
  if (auth.jabatan !== 'Admin Program') {
    return NextResponse.json({ message: 'Akses ditolak: Hanya Admin Program' }, { status: 403 });
  }
  
  try {
    // --- PERUBAHAN KE SUPABASE ---
    // Kueri JOIN diterjemahkan ke Supabase select
    const { data, error } = await supabase
      .from('pengeluaran')
      .select(`
        *, 
        kegiatan ( nama_program ),
        admin ( user ( nama ) )
      `)
      .order('tanggal', { ascending: false });

    if (error) throw error;
    
    // Ratakan (flatten) data agar sesuai output lama
    const expenses = data.map(p => ({
        ...p,
        nama_program: p.kegiatan?.nama_program,
        nama_admin: p.admin?.user?.nama,
        kegiatan: undefined, // Hapus data nested
        admin: undefined, // Hapus data nested
    }));
    // --- AKHIR PERUBAHAN ---
    
    return NextResponse.json(expenses, { status: 200 });
  } catch (error) {
    console.error('[EXPENSES_GET]', error);
    return NextResponse.json(
      { message: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

// --- 2. FUNGSI POST (Membuat pengeluaran baru) ---
export async function POST(request: NextRequest) { // <-- PERBAIKAN: Ganti Request dengan NextRequest
  const auth = await verifyAdmin(request);
  
  if (!auth.isAdmin || !auth.userId) {
    return auth.response;
  }
  if (auth.jabatan !== 'Admin Program') {
    return NextResponse.json({ message: 'Akses ditolak: Hanya Admin Program' }, { status: 403 });
  }

  // Dapatkan id_admin dari id_user (diambil dari token)
  let adminId;
  try {
    // --- PERUBAHAN KE SUPABASE ---
    const { data: adminData, error: adminError } = await supabase
      .from('admin')
      .select('id_admin')
      .eq('id_user', auth.userId)
      .single(); // Ambil satu

    if (adminError || !adminData) {
      console.error('[EXPENSES_POST_ADMIN_QUERY]', adminError);
      return NextResponse.json({ message: 'Data admin tidak ditemukan untuk user ini' }, { status: 403 });
    }
    adminId = adminData.id_admin;
    // --- AKHIR PERUBAHAN ---
  } catch (dbError) {
     console.error('[EXPENSES_POST_ADMIN_QUERY_CATCH]', dbError);
     return NextResponse.json({ message: 'Gagal memverifikasi admin' }, { status: 500 });
  }
  
  try {
    const body = await request.json();
    const { 
      description, 
      type, 
      amount, 
      item_details, 
      expense_date, 
      id_kegiatan 
    } = body;

    // (Validasi input tetap sama)
    if (!description || !type || !expense_date) {
      return NextResponse.json(
        { message: 'Deskripsi, jenis, dan tanggal pengeluaran harus diisi' },
        { status: 400 }
      );
    }
    if (type === 'uang' && (!amount || amount <= 0)) {
        return NextResponse.json(
         { message: 'Jumlah (amount) harus diisi untuk pengeluaran uang' },
         { status: 400 }
       );
    }
    if (type === 'barang' && !item_details) {
        return NextResponse.json(
         { message: 'Detail barang harus diisi untuk pengeluaran barang' },
         { status: 400 }
       );
    }
    
    // --- PERUBAHAN KE SUPABASE ---
    const { error: insertError } = await supabase
      .from('pengeluaran')
      .insert({
        id_kegiatan: id_kegiatan || null,
        id_admin: adminId,
        tanggal: expense_date,
        deskripsi: description,
        type: type,
        nominal: type === 'uang' ? amount : null,
        item_details: type === 'barang' ? item_details : null
      });

    if (insertError) throw insertError;
    // --- AKHIR PERUBAHAN ---

    return NextResponse.json(
      { message: 'Pengeluaran berhasil dicatat' },
      { status: 201 }
    );
  } catch (error) {
    console.error('[EXPENSES_POST]', error);
    return NextResponse.json(
      { message: 'Internal Server Error' },
      { status: 500 }
    );
  }
}