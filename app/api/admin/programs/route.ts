// File: app/api/admin/programs/route.ts

import { NextResponse, type NextRequest } from 'next/server';
import { supabase } from '@/lib/supabaseClient'; 
import { verifyAdmin } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

// --- 1. FUNGSI GET ---
export async function GET(request:  NextRequest) {
  const auth = await verifyAdmin(request);

  if (!auth.isAdmin) {
    return auth.response; 
  }

  const isAdminProgram = auth.jabatan === 'Admin Program';
  const isAdminOperasional = auth.jabatan === 'Admin Operasional';
  const isSuperAdmin = auth.jabatan === 'Super Admin';

  if (!isAdminProgram && ! isAdminOperasional && ! isSuperAdmin) {
    return NextResponse.json({ message: 'Akses ditolak' }, { status: 403 });
  }
  
  try {
    let query = supabase.from('kegiatan').select('*');
    
    if (isAdminOperasional && ! isAdminProgram && !isSuperAdmin) {
        query = query.eq('status', 'Aktif'); 
    }

    const { data:  programs, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;
    
    return NextResponse.json(programs, { status: 200 });
  } catch (error) {
    console.error('[KEGIATAN_GET]', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

// --- 2. FUNGSI POST ---
export async function POST(request: NextRequest) {
  const auth = await verifyAdmin(request);

  if (!auth.isAdmin || ! auth.userId) {
    return auth.response;
  }
  
  if (auth.jabatan !== 'Admin Program' && auth.jabatan !== 'Super Admin') {
    return NextResponse.json({ message: 'Akses ditolak:  Hanya Admin Program' }, { status: 403 });
  }

  try {
    const formData = await request. formData();
    const name = formData.get('name') as string;
    const description = formData.get('description') as string;
    const startDate = formData.get('startDate') as string;
    const targetDanaInput = formData.get('targetDana'); 
    const posterFile = formData.get('poster') as File | null;

    const { data:  adminData } = await supabase
      . from('admin')
      .select('id_admin')
      .eq('id_user', auth.userId)
      .single();

    if (!adminData) throw new Error('Data admin tidak ditemukan');

    let posterUrl:  string | null = null; 
    if (posterFile) {
      const buffer = Buffer.from(await posterFile.arrayBuffer());
      const safeFilename = posterFile.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const uniqueFilename = `${Date.now()}_${safeFilename}`;
      
      const { error:  uploadError } = await supabase. storage
        .from('posters') 
        .upload(uniqueFilename, buffer, { contentType: posterFile.type });

      if (! uploadError) {
        const { data: publicUrlData } = supabase.storage. from('posters').getPublicUrl(uniqueFilename);
        posterUrl = publicUrlData. publicUrl;
      }
    }

    const { error:  insertError } = await supabase. from('kegiatan').insert({
      id_admin: adminData.id_admin,
      nama_program: name,
      deskripsi: description || null,
      tanggal_mulai: startDate,
      url_poster: posterUrl,
      target_dana:  parseFloat(targetDanaInput?. toString() || '0'),
      status: 'Aktif' 
    });

    if (insertError) throw insertError;

    revalidatePath('/');
    return NextResponse.json({ message: 'Kegiatan berhasil dibuat' }, { status: 201 });
  } catch (error:  any) {
    console.error('[KEGIATAN_POST]', error);
    return NextResponse.json({ message: `Gagal: ${error.message}` }, { status: 500 });
  }
}

// ═══════════════════════════════════════════════════════════════
// ✅ PERBAIKAN:  PATCH ROUTE (Sekarang support JSON + FormData)
// ═══════════════════════════════════════════════════════════════
export async function PATCH(request: NextRequest) {
  const auth = await verifyAdmin(request);

  if (!auth.isAdmin) return auth.response;
  if (auth.jabatan !== 'Admin Program' && auth.jabatan !== 'Super Admin') {
    return NextResponse.json({ message: 'Akses ditolak' }, { status: 403 });
  }

  try {
    // ✅ PERBAIKAN 1: Support JSON request (untuk stop program)
    let requestData: any = {};
    const contentType = request.headers.get('content-type') || '';

    if (contentType.includes('application/json')) {
      // ← JSON request (dari handleStopProgram)
      requestData = await request.json();
      console.log('[PATCH_JSON]', requestData);
    } else if (contentType.includes('multipart/form-data')) {
      // ← FormData request (dari edit program form)
      const formData = await request.formData();
      requestData = {
        id: formData.get('id'),
        status: formData.get('status'),
        name: formData.get('name'),
        description: formData.get('description'),
        targetDana: formData.get('targetDana'),
        posterFile: formData.get('poster')
      };
      console.log('[PATCH_FORMDATA]', requestData);
    }

    // ✅ PERBAIKAN 2: Handle berbagai field names
    const id = requestData.id || requestData.id_kegiatan;
    const statusInput = requestData.status || requestData.status_kegiatan;
    const name = requestData.name;
    const description = requestData. description;
    const targetDanaInput = requestData.targetDana;
    const posterFile = requestData.posterFile;

    if (!id) {
      return NextResponse.json({ message: 'ID diperlukan' }, { status: 400 });
    }

    // ✅ PERBAIKAN 3: Jika hanya status yang di-update (stop program)
    if (statusInput && ! name && !posterFile) {
      console.log(`[PATCH_STOP_PROGRAM] Mengubah status program #${id} ke "${statusInput}"`);

      // Get current program
      const { data: currentProgram, error:  getError } = await supabase
        .from('kegiatan')
        .select('status')
        .eq('id_kegiatan', id)
        .single();

      if (getError || !currentProgram) {
        return NextResponse.json({ message: 'Program tidak ditemukan' }, { status: 404 });
      }

      // Validate status
      const validStatuses = ['Draft', 'Aktif', 'Berjalan', 'Selesai'];
      if (!validStatuses.includes(statusInput)) {
        return NextResponse.json(
          { message: `Status tidak valid.  Hanya:  ${validStatuses.join(', ')}` },
          { status: 400 }
        );
      }

      // Check:  tidak boleh update jika sudah selesai
      if (currentProgram.status === 'Selesai') {
        return NextResponse.json(
          { message: 'Tidak bisa mengubah program yang sudah Selesai' },
          { status: 400 }
        );
      }

      // Update hanya status
      const { error: updateError } = await supabase
        .from('kegiatan')
        .update({ 
          status: statusInput,
          updated_at: new Date().toISOString()
        })
        .eq('id_kegiatan', id);

      if (updateError) throw updateError;

      revalidatePath('/');
      revalidatePath(`/admin/programs`);

      return NextResponse.json(
        { 
          message: `Program berhasil dihentikan (status: ${statusInput})`,
          id_kegiatan: id,
          status: statusInput
        },
        { status: 200 }
      );
    }

    // ✅ PERBAIKAN 4: Jika edit program lengkap (FormData)
    const { data: oldData } = await supabase
      .from('kegiatan')
      .select('url_poster')
      .eq('id_kegiatan', id)
      .single();

    let posterUrl = oldData?.url_poster;

    if (posterFile && typeof posterFile !== 'string') {
      // Hapus file lama
      if (oldData?.url_poster) {
        const oldFilename = oldData.url_poster.split('/').pop();
        if (oldFilename) {
          await supabase.storage.from('posters').remove([oldFilename]);
        }
      }

      // Upload file baru
      const buffer = Buffer. from(await posterFile.arrayBuffer());
      const uniqueFilename = `${Date.now()}_${posterFile.name.replace(/\s/g, '_')}`;
      const { error: upErr } = await supabase.storage
        .from('posters')
        .upload(uniqueFilename, buffer, {
          contentType: posterFile. type,
          upsert:  true
        });

      if (!upErr) {
        posterUrl = supabase.storage.from('posters').getPublicUrl(uniqueFilename).data.publicUrl;
      }
    }

    // Build update payload
    const updatePayload: any = {};
    if (statusInput) updatePayload.status = statusInput;
    if (name) updatePayload.nama_program = name;
    if (description) updatePayload.deskripsi = description;
    if (posterUrl) updatePayload.url_poster = posterUrl;
    if (targetDanaInput) updatePayload.target_dana = parseFloat(targetDanaInput.toString());

    if (Object.keys(updatePayload).length === 0) {
      return NextResponse.json({ message: 'Tidak ada data untuk diupdate' }, { status: 400 });
    }

    const { error } = await supabase
      .from('kegiatan')
      .update(updatePayload)
      .eq('id_kegiatan', id);

    if (error) throw error;

    revalidatePath('/');
    revalidatePath(`/programs/${id}`);
    revalidatePath(`/live-reports/${id}`);
    revalidatePath(`/admin/programs`);

    return NextResponse.json({ message: 'Program berhasil diperbarui' }, { status: 200 });

  } catch (error: any) {
    console.error('[KEGIATAN_PATCH_ERROR]', error);
    return NextResponse.json(
      { 
        message: error.message || 'Gagal memperbaharui program',
        details: process.env.NODE_ENV === 'development' ? error.message :  undefined
      },
      { status: 500 }
    );
  }
}