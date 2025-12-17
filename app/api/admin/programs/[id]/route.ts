import { NextResponse, type NextRequest } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import { verifyAdmin } from '@/lib/auth';

// --- GET: Ambil Detail 1 Program (untuk pre-fill form edit) ---
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await verifyAdmin(request);
  if (!auth.isAdmin) return auth.response;

  try {
    const { data, error } = await supabase
      .from('kegiatan')
      .select('*')
      .eq('id_kegiatan', params.id)
      .single();

    if (error) throw error;
    if (!data) return NextResponse.json({ message: 'Program tidak ditemukan' }, { status: 404 });

    return NextResponse.json(data, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

// --- PATCH: Update Data Program (Edit) ---
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await verifyAdmin(request);
  if (!auth.isAdmin) return auth.response;

  // LOGIC BARU: Izinkan jika Admin Program ATAU Super Admin
  if (auth.jabatan !== 'Admin Program' && auth.jabatan !== 'Super Admin') {
    return NextResponse.json({ message: 'Akses ditolak' }, { status: 403 });
  }

  try {
    const formData = await request.formData();
    const name = formData.get('name') as string;
    const description = formData.get('description') as string;
    const startDate = formData.get('startDate') as string;
    const targetDanaInput = formData.get('targetDana');
    const posterFile = formData.get('poster') as File | null;

    // Parsing Target Dana
    let targetDana = 0;
    if (targetDanaInput) {
      const parsed = parseFloat(targetDanaInput.toString());
      if (!isNaN(parsed)) targetDana = parsed;
    }

    // Objek update dasar
    const updateData: any = {
      nama_program: name,
      deskripsi: description || null,
      tanggal_mulai: startDate,
      target_dana: targetDana,
      // Status tidak diubah di sini (kecuali mau fitur reactivate)
    };

    // Logika Upload Poster Baru (Jika ada file baru dipilih)
    if (posterFile) {
      const buffer = Buffer.from(await posterFile.arrayBuffer());
      const safeFilename = posterFile.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const uniqueFilename = `${Date.now()}_${safeFilename}`;

      const { error: uploadError } = await supabase.storage
        .from('posters')
        .upload(uniqueFilename, buffer, {
          contentType: posterFile.type,
          upsert: false,
        });

      if (uploadError) throw new Error('Gagal upload poster baru: ' + uploadError.message);

      const { data: publicUrlData } = supabase.storage
        .from('posters')
        .getPublicUrl(uniqueFilename);

      // Masukkan URL baru ke data update
      updateData.url_poster = publicUrlData.publicUrl;
    }

    // Eksekusi Update ke Database
    const { error } = await supabase
      .from('kegiatan')
      .update(updateData)
      .eq('id_kegiatan', params.id);

    if (error) throw error;

    return NextResponse.json({ message: 'Program berhasil diperbarui' }, { status: 200 });

  } catch (error: any) {
    console.error('[PROGRAM_EDIT]', error);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}