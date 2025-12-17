import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { supabase } from '@/lib/supabaseClient'; 

export const dynamic = 'force-dynamic'; // Tambahan biar ga cache

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET tidak ditemukan di .env.local');
}
const secretKey = new TextEncoder().encode(JWT_SECRET);

interface UserPayload {
  userId: number;
  // ... tipe lain dari JWT
}

export async function GET() {
  const tokenCookie = cookies().get('session_token');

  if (!tokenCookie) {
    return NextResponse.json(
      { message: 'Tidak terautentikasi' },
      { status: 401 }
    );
  }

  const token = tokenCookie.value;

  try {
    const { payload } = (await jwtVerify(token, secretKey)) as { payload: UserPayload };

    // Ambil data pengguna terbaru + join admin/donatur
    const { data, error } = await supabase
      .from('user')
      .select(`
        id_user, 
        nama, 
        email, 
        role, 
        donatur ( no_telp ),
        admin ( jabatan )
      `)
      .eq('id_user', payload.userId)
      .single();

    if (error || !data) {
      console.error('[ME_GET_SUPABASE_ERROR]', error);
      return NextResponse.json(
        { message: 'Pengguna tidak ditemukan' },
        { status: 404 }
      );
    }
    
    // Ratakan data (flatten)
    const donaturData = Array.isArray(data.donatur) ? data.donatur[0] : data.donatur;
    const adminData = Array.isArray(data.admin) ? data.admin[0] : data.admin;

    // --- BAGIAN PENTING YANG DIUBAH ---
    // Logika: Jika ada jabatan (misal "Super Admin"), pakai itu sebagai Role.
    // Jika tidak ada (misal donatur), pakai role asli dari tabel user.
    const effectiveRole = adminData?.jabatan ? adminData.jabatan : data.role;

    const user = {
      id_user: data.id_user,
      nama: data.nama,
      email: data.email,
      role: effectiveRole, // <-- Di sini kuncinya! Frontend akan terima "Super Admin"
      phone: donaturData?.no_telp || null,
      jabatan: adminData?.jabatan || null,
    };
    // ----------------------------------

    return NextResponse.json({ user: user }, { status: 200 });

  } catch (err) {
    console.error('JWT Verify Error:', err);
    cookies().set('session_token', '', { maxAge: -1, path: '/' });
    return NextResponse.json(
      { message: 'Session tidak valid atau kedaluwarsa' },
      { status: 401 }
    );
  }
}