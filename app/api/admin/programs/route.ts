import { NextResponse, type NextRequest } from 'next/server';
import { supabase } from '@/lib/supabaseClient'; 
import { verifyAdmin } from '@/lib/auth';

// --- 1. FUNGSI GET (Mengambil kegiatan) ---
export async function GET(request: NextRequest) {
  const auth = await verifyAdmin(request);

  if (!auth.isAdmin) {
    return auth.response; 
  }

  const isAdminProgram = auth.jabatan === 'Admin Program';
  const isAdminOperasional = auth.jabatan === 'Admin Operasional';
  const isSuperAdmin = auth.jabatan === 'Super Admin';

  if (!isAdminProgram && !isAdminOperasional && !isSuperAdmin) {
    return NextResponse.json({ message: 'Akses ditolak' }, { status: 403 });
  }
  
  try {
    let query = supabase.from('kegiatan').select('*');

    // [PERBAIKAN DISINI]
    // Sebelumnya: .select('id_kegiatan, nama_program, status') -> Poster tidak ikut terambil.
    // Sekarang: Kita hapus .select(...) agar default mengambil semua kolom (*) termasuk url_poster.
    
    if (isAdminOperasional && !isAdminProgram && !isSuperAdmin) {
        // Kita hanya filter statusnya saja agar hanya yang 'Aktif'
        query = query.eq('status', 'Aktif'); 
    }

    const { data: programs, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;
    
    return NextResponse.json(programs, { status: 200 });
  } catch (error) {
    console.error('[KEGIATAN_GET]', error);
    return NextResponse.json(
      { message: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

// --- 2. FUNGSI POST (Tidak ada perubahan, tetap gunakan kode sebelumnya) ---
export async function POST(request: NextRequest) {
  // ... (Gunakan kode POST yang terakhir saya berikan) ...
  // Biar tidak kepanjangan, bagian ini tidak saya tulis ulang karena tidak ada error di sini.
  // Pastikan logic auth jabatannya sudah menyertakan Super Admin seperti sebelumnya.
  const auth = await verifyAdmin(request);

  if (!auth.isAdmin || !auth.userId) {
    return auth.response;
  }
  
  if (auth.jabatan !== 'Admin Program' && auth.jabatan !== 'Super Admin') {
    return NextResponse.json({ message: 'Akses ditolak: Hanya Admin Program' }, { status: 403 });
  }

  let adminId;
  try {
    const { data: adminData, error: adminError } = await supabase
      .from('admin')
      .select('id_admin')
      .eq('id_user', auth.userId)
      .single();
      
    if (adminError || !adminData) {
        throw new Error('Data admin tidak ditemukan');
    }
    adminId = adminData.id_admin;
  } catch (dbError) {
     return NextResponse.json({ message: 'Gagal memverifikasi admin' }, { status: 500 });
  }
  
  try {
    const formData = await request.formData();

    const name = formData.get('name') as string;
    const description = formData.get('description') as string;
    const startDate = formData.get('startDate') as string;
    const targetDanaInput = formData.get('targetDana'); 
    const posterFile = formData.get('poster') as File | null;

    if (!name || !startDate) {
      return NextResponse.json(
        { message: 'Nama kegiatan dan tanggal mulai harus diisi' },
        { status: 400 }
      );
    }

    let targetDana = 0;
    if (targetDanaInput) {
        const parsed = parseFloat(targetDanaInput.toString());
        if (!isNaN(parsed)) targetDana = parsed;
    }

    let posterUrl: string | null = null; 
    if (posterFile) {
      try {
        const buffer = Buffer.from(await posterFile.arrayBuffer());
        const safeFilename = posterFile.name.replace(/[^a-zA-Z0-9._-]/g, '_');
        const uniqueFilename = `${Date.now()}_${safeFilename}`;
        
        const { error: uploadError } = await supabase.storage
          .from('posters') 
          .upload(uniqueFilename, buffer, {
            contentType: posterFile.type,
            upsert: false,
          });

        if (uploadError) throw new Error('Gagal mengunggah poster: ' + uploadError.message);

        const { data: publicUrlData } = supabase.storage
          .from('posters')
          .getPublicUrl(uniqueFilename);

        posterUrl = publicUrlData.publicUrl;
      } catch (uploadError) {
        console.error('[FILE_UPLOAD_CATCH]', uploadError);
        posterUrl = null; 
      }
    }

    const { error: insertError } = await supabase
      .from('kegiatan')
      .insert({
        id_admin: adminId,
        nama_program: name,
        deskripsi: description || null,
        tanggal_mulai: startDate,
        url_poster: posterUrl,
        target_dana: targetDana,
        status: 'Aktif' 
      });

    if (insertError) {
        console.error('[SUPABASE_INSERT_ERROR]', insertError);
        throw new Error(insertError.message || 'Gagal menyimpan ke database');
    }

    return NextResponse.json(
      { message: 'Kegiatan berhasil dibuat' },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('[KEGIATAN_POST]', error);
    const errorMessage = error?.message || (typeof error === 'string' ? error : 'Terjadi kesalahan sistem');
    return NextResponse.json(
      { message: `Gagal Menyimpan: ${errorMessage}` },
      { status: 500 }
    );
  }
}

// --- 3. FUNGSI PATCH (Tidak ada perubahan) ---
export async function PATCH(request: NextRequest) {
  const auth = await verifyAdmin(request);

  if (!auth.isAdmin) {
    return auth.response;
  }
  
  if (auth.jabatan !== 'Admin Program' && auth.jabatan !== 'Super Admin') {
    return NextResponse.json({ message: 'Akses ditolak: Hanya Admin Program' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { id, status } = body; 

    if (!id || !status) {
       return NextResponse.json({ message: 'ID Program dan Status baru diperlukan' }, { status: 400 });
    }

    const { error } = await supabase
      .from('kegiatan')
      .update({ status: status }) 
      .eq('id_kegiatan', id);

    if (error) throw error;

    return NextResponse.json({ message: 'Status program berhasil diperbarui' }, { status: 200 });

  } catch (error) {
    console.error('[KEGIATAN_PATCH]', error);
    return NextResponse.json(
      { message: 'Gagal memperbarui status program' },
      { status: 500 }
    );
  }
}