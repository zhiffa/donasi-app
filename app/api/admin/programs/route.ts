// File: app/api/admin/programs/route.ts

import { NextResponse, type NextRequest } from 'next/server'; // <-- PERBAIKAN: Tambahkan NextRequest
import { supabase } from '@/lib/supabaseClient'; 
import { verifyAdmin } from '@/lib/auth';

// --- 1. FUNGSI GET (Mengambil semua kegiatan) ---
export async function GET(request: NextRequest) { // <-- PERBAIKAN: Ganti Request dengan NextRequest
  const auth = await verifyAdmin(request);

  if (!auth.isAdmin) {
    return auth.response; 
  }
  if (auth.jabatan !== 'Admin Program') {
    return NextResponse.json({ message: 'Akses ditolak: Hanya Admin Program' }, { status: 403 });
  }
  
  try {
    // --- PERUBAHAN KE SUPABASE ---
    const { data: programs, error } = await supabase
      .from('kegiatan')
      .select('*')
      .order('tanggal_mulai', { ascending: false });

    if (error) throw error;
    // --- AKHIR PERUBAHAN ---
    
    return NextResponse.json(programs, { status: 200 });
  } catch (error) {
    console.error('[KEGIATAN_GET]', error);
    return NextResponse.json(
      { message: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

// --- FUNGSI POST (Membuat kegiatan baru) ---
export async function POST(request: NextRequest) { // <-- PERBAIKAN: Ganti Request dengan NextRequest
  const auth = await verifyAdmin(request);

  if (!auth.isAdmin || !auth.userId) {
    return auth.response;
  }
  if (auth.jabatan !== 'Admin Program') {
    return NextResponse.json({ message: 'Akses ditolak: Hanya Admin Program' }, { status: 403 });
  }

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
     console.error('[KEGIATAN_POST_ADMIN_QUERY]', dbError);
     return NextResponse.json({ message: 'Gagal memverifikasi admin' }, { status: 500 });
  }
  
  try {
    const formData = await request.formData();

    const name = formData.get('name') as string;
    const description = formData.get('description') as string;
    const startDate = formData.get('startDate') as string;
    const posterFile = formData.get('poster') as File | null;

    if (!name || !startDate) {
      return NextResponse.json(
        { message: 'Nama kegiatan dan tanggal mulai harus diisi' },
        { status: 400 }
      );
    }

    // --- LOGIKA UPLOAD FILE (DIGANTI KE SUPABASE STORAGE) ---
    let posterUrl: string | null = null; 

    if (posterFile) {
      try {
        const buffer = Buffer.from(await posterFile.arrayBuffer());
        const safeFilename = posterFile.name.replace(/[^a-zA-Z0-9._-]/g, '_');
        const uniqueFilename = `${Date.now()}_${safeFilename}`;
        
        // 1. Upload ke Supabase Storage (pastikan buat bucket 'posters')
        const { error: uploadError } = await supabase.storage
          .from('posters') // NAMA BUCKET ANDA
          .upload(uniqueFilename, buffer, {
            contentType: posterFile.type,
            upsert: false, // jangan timpa file
          });

        if (uploadError) {
            console.error('[FILE_UPLOAD_ERROR]', uploadError);
            throw new Error('Gagal mengunggah poster: ' + uploadError.message);
        }

        // 2. Dapatkan URL publik dari file yang diupload
        const { data: publicUrlData } = supabase.storage
          .from('posters')
          .getPublicUrl(uniqueFilename);

        posterUrl = publicUrlData.publicUrl;
        
      } catch (uploadError) {
        console.error('[FILE_UPLOAD_CATCH]', uploadError);
        // Gagal upload, tapi lanjutkan tanpa poster
        posterUrl = null; 
      }
    }
    // --- AKHIR LOGIKA UPLOAD FILE ---

    // --- PERUBAHAN KE SUPABASE ---
    const { error: insertError } = await supabase
      .from('kegiatan')
      .insert({
        id_admin: adminId,
        nama_program: name,
        deskripsi: description || null,
        tanggal_mulai: startDate,
        url_poster: posterUrl,
        status: 'Aktif'
      });

    if (insertError) throw insertError;
    // --- AKHIR PERUBAHAN ---

    return NextResponse.json(
      { message: 'Kegiatan berhasil dibuat' },
      { status: 201 }
    );
  } catch (error) {
    console.error('[KEGIATAN_POST]', error);
    
    // <-- PERBAIKAN: Handle 'unknown' error type dengan aman
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return NextResponse.json(
      { message: `Internal Server Error: ${errorMessage}` },
      { status: 500 }
    );
  }
}