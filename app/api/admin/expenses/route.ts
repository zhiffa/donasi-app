import { NextResponse, type NextRequest } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import { verifyAdmin } from '@/lib/auth';

// --- 1. FUNGSI GET (Mengambil semua pengeluaran) ---
export async function GET(request: NextRequest) { 
  const auth = await verifyAdmin(request);
  
  if (!auth.isAdmin) {
    return auth.response;
  }
  
  // LOGIC BARU: Izinkan jika Admin Program ATAU Super Admin
  if (auth.jabatan !== 'Admin Program' && auth.jabatan !== 'Super Admin') {
    return NextResponse.json({ message: 'Akses ditolak: Hanya Admin Program' }, { status: 403 });
  }
  
  try {
    const { data, error } = await supabase
      .from('pengeluaran')
      .select(`
        *, 
        kegiatan ( nama_program ),
        admin ( user ( nama ) )
      `)
      .order('tanggal', { ascending: false });

    if (error) throw error;
    
    // Ratakan (flatten) data agar sesuai output frontend
    const expenses = data.map(p => ({
        ...p,
        nama_program: p.kegiatan?.nama_program,
        nama_admin: p.admin?.user?.nama,
        kegiatan: undefined,
        admin: undefined,
    }));
    
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
export async function POST(request: NextRequest) {
  const auth = await verifyAdmin(request);
  
  if (!auth.isAdmin || !auth.userId) {
    return auth.response;
  }
  
  // LOGIC BARU: Izinkan jika Admin Program ATAU Super Admin
  if (auth.jabatan !== 'Admin Program' && auth.jabatan !== 'Super Admin') {
    return NextResponse.json({ message: 'Akses ditolak: Hanya Admin Program' }, { status: 403 });
  }

  // Dapatkan id_admin dari id_user
  let adminId;
  try {
    const { data: adminData, error: adminError } = await supabase
      .from('admin')
      .select('id_admin')
      .eq('id_user', auth.userId)
      .single();

    if (adminError || !adminData) {
      console.error('[EXPENSES_POST_ADMIN_QUERY]', adminError);
      return NextResponse.json({ message: 'Data admin tidak ditemukan untuk user ini' }, { status: 403 });
    }
    adminId = adminData.id_admin;
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

// --- 3. FUNGSI DELETE (Menghapus pengeluaran) ---
export async function DELETE(request: NextRequest) {
  const auth = await verifyAdmin(request);
  
  // Validasi Admin & Jabatan
  if (!auth.isAdmin) return auth.response;

  // LOGIC BARU: Izinkan jika Admin Program ATAU Super Admin
  if (auth.jabatan !== 'Admin Program' && auth.jabatan !== 'Super Admin') {
    return NextResponse.json({ message: 'Akses ditolak: Hanya Admin Program' }, { status: 403 });
  }

  // Ambil ID dari URL params (contoh: ?id=123)
  const searchParams = request.nextUrl.searchParams;
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ message: 'ID pengeluaran diperlukan' }, { status: 400 });
  }

  try {
    const { error } = await supabase
      .from('pengeluaran')
      .delete()
      .eq('id_pengeluaran', id);

    if (error) throw error;

    return NextResponse.json({ message: 'Data berhasil dihapus' }, { status: 200 });
  } catch (error) {
    console.error('[EXPENSES_DELETE]', error);
    return NextResponse.json(
      { message: 'Gagal menghapus data di server' },
      { status: 500 }
    );
  }
}