import { NextResponse, type NextRequest } from 'next/server';
import { supabase } from '@/lib/supabaseClient'; 
import { verifyAdmin } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

// --- 1. FUNGSI GET (Mengambil daftar kegiatan) ---
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
    // Mengambil semua kolom termasuk url_poster
    let query = supabase.from('kegiatan').select('*');
    
    // Filter khusus untuk Admin Operasional hanya melihat yang aktif
    if (isAdminOperasional && !isAdminProgram && !isSuperAdmin) {
        query = query.eq('status', 'Aktif'); 
    }

    const { data: programs, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;
    
    return NextResponse.json(programs, { status: 200 });
  } catch (error) {
    console.error('[KEGIATAN_GET]', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

// --- 2. FUNGSI POST (Membuat kegiatan baru) ---
export async function POST(request: NextRequest) {
  const auth = await verifyAdmin(request);

  if (!auth.isAdmin || !auth.userId) {
    return auth.response;
  }
  
  if (auth.jabatan !== 'Admin Program' && auth.jabatan !== 'Super Admin') {
    return NextResponse.json({ message: 'Akses ditolak: Hanya Admin Program' }, { status: 403 });
  }

  try {
    const formData = await request.formData();
    const name = formData.get('name') as string;
    const description = formData.get('description') as string;
    const startDate = formData.get('startDate') as string;
    const targetDanaInput = formData.get('targetDana'); 
    const posterFile = formData.get('poster') as File | null;

    // Ambil ID Admin berdasarkan ID User dari auth
    const { data: adminData } = await supabase
      .from('admin')
      .select('id_admin')
      .eq('id_user', auth.userId)
      .single();

    if (!adminData) throw new Error('Data admin tidak ditemukan');

    let posterUrl: string | null = null; 
    if (posterFile) {
      const buffer = Buffer.from(await posterFile.arrayBuffer());
      const safeFilename = posterFile.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const uniqueFilename = `${Date.now()}_${safeFilename}`;
      
      const { error: uploadError } = await supabase.storage
        .from('posters') 
        .upload(uniqueFilename, buffer, { contentType: posterFile.type });

      if (!uploadError) {
        const { data: publicUrlData } = supabase.storage.from('posters').getPublicUrl(uniqueFilename);
        posterUrl = publicUrlData.publicUrl;
      }
    }

    const { error: insertError } = await supabase.from('kegiatan').insert({
      id_admin: adminData.id_admin,
      nama_program: name,
      deskripsi: description || null,
      tanggal_mulai: startDate,
      url_poster: posterUrl,
      target_dana: parseFloat(targetDanaInput?.toString() || '0'),
      status: 'Aktif' 
    });

    if (insertError) throw insertError;

    revalidatePath('/');
    return NextResponse.json({ message: 'Kegiatan berhasil dibuat' }, { status: 201 });
  } catch (error: any) {
    console.error('[KEGIATAN_POST]', error);
    return NextResponse.json({ message: `Gagal: ${error.message}` }, { status: 500 });
  }
}

// --- 3. FUNGSI PATCH (Edit kegiatan & ganti poster) ---
export async function PATCH(request: NextRequest) {
  const auth = await verifyAdmin(request);

  if (!auth.isAdmin) return auth.response;
  if (auth.jabatan !== 'Admin Program' && auth.jabatan !== 'Super Admin') {
    return NextResponse.json({ message: 'Akses ditolak' }, { status: 403 });
  }

  try {
    const formData = await request.formData();
    const id = formData.get('id') as string;
    const status = formData.get('status') as string;
    const name = formData.get('name') as string;
    const description = formData.get('description') as string;
    const targetDanaInput = formData.get('targetDana');
    const posterFile = formData.get('poster') as File | null;

    if (!id) return NextResponse.json({ message: 'ID diperlukan' }, { status: 400 });

    // Cek data lama untuk menghapus poster lama jika ada penggantian
    const { data: oldData } = await supabase
      .from('kegiatan')
      .select('url_poster')
      .eq('id_kegiatan', id)
      .single();

    let posterUrl = oldData?.url_poster;

    if (posterFile && typeof posterFile !== 'string') {
      // Hapus file lama dari Storage
      if (oldData?.url_poster) {
        const oldFilename = oldData.url_poster.split('/').pop();
        if (oldFilename) await supabase.storage.from('posters').remove([oldFilename]);
      }

      // Upload file baru
      const buffer = Buffer.from(await posterFile.arrayBuffer());
      const uniqueFilename = `${Date.now()}_${posterFile.name.replace(/\s/g, '_')}`;
      const { error: upErr } = await supabase.storage.from('posters').upload(uniqueFilename, buffer, {
        contentType: posterFile.type,
        upsert: true
      });

      if (!upErr) {
        posterUrl = supabase.storage.from('posters').getPublicUrl(uniqueFilename).data.publicUrl;
      }
    }

    const updatePayload: any = {};
    if (status) updatePayload.status = status;
    if (name) updatePayload.nama_program = name;
    if (description) updatePayload.deskripsi = description;
    if (posterUrl) updatePayload.url_poster = posterUrl;
    if (targetDanaInput) updatePayload.target_dana = parseFloat(targetDanaInput.toString());

    const { error } = await supabase.from('kegiatan').update(updatePayload).eq('id_kegiatan', id);
    if (error) throw error;

    revalidatePath('/');
    revalidatePath(`/programs/${id}`);
    revalidatePath(`/live-reports/${id}`);

    return NextResponse.json({ message: 'Program berhasil diperbarui' }, { status: 200 });
  } catch (error: any) {
    console.error('[KEGIATAN_PATCH]', error);
    return NextResponse.json({ message: 'Gagal memperbarui program' }, { status: 500 });
  }
}