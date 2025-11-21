import { NextResponse, type NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify, type JWTPayload } from 'jose';
import { supabase } from '@/lib/supabaseClient';

// Dapatkan secret key dari .env.local
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET tidak ditemukan di .env.local');
}
const secretKey = new TextEncoder().encode(JWT_SECRET);

// Tipe data payload dari JWT
interface UserPayload extends JWTPayload {
  userId: number;
  role: 'admin' | 'donatur';
  name: string;
  jabatan: 'Admin Program' | 'Admin Operasional' | null;
}

// Tipe data untuk hasil return verifyAdmin
interface AuthResult {
  isAdmin: boolean;
  userId: number | null;
  jabatan: 'Admin Program' | 'Admin Operasional' | null;
  response: NextResponse; 
}

// Tipe data untuk hasil return verifyUser (User Biasa)
interface UserAuthResult {
  isAuthenticated: boolean;
  userId: number | null;
  role: 'admin' | 'donatur' | null;
  response: NextResponse;
}

/**
 * Helper untuk memverifikasi token ADMIN
 */
export async function verifyAdmin(request: NextRequest): Promise<AuthResult> {
  const tokenCookie = cookies().get('session_token');
  const unauthorizedResponse = NextResponse.json({ message: 'Tidak terautentikasi' }, { status: 401 });

  if (!tokenCookie) {
    return { isAdmin: false, userId: null, jabatan: null, response: unauthorizedResponse };
  }

  try {
    const token = tokenCookie.value; // <-- PERBAIKAN: Definisi token

    // 1. Verifikasi token
    const { payload } = await jwtVerify(token, secretKey) as { payload: UserPayload };

    // 2. Cek apakah rolenya admin
    if (payload.role !== 'admin') {
      return { 
        isAdmin: false, 
        userId: payload.userId, 
        jabatan: null, 
        response: NextResponse.json({ message: 'Akses ditolak: Bukan admin' }, { status: 403 }) 
      };
    }

    // 3. Ambil data admin terbaru dari Supabase
    // <-- PERBAIKAN: Menghapus typo '_' setelah kurung kurawal
    const { data: adminData, error } = await supabase
      .from('admin')
      .select('jabatan')
      .eq('id_user', payload.userId)
      .single();

    if (error || !adminData) {
        return { 
        isAdmin: false, 
        userId: payload.userId, 
        jabatan: null, 
        response: NextResponse.json({ message: 'Data admin tidak terkait' }, { status: 403 }) 
      };
    }

    // 4. Berhasil
    return {
      isAdmin: true,
      userId: payload.userId,
      jabatan: adminData.jabatan as 'Admin Program' | 'Admin Operasional',
      response: unauthorizedResponse,
    };

  } catch (err) {
    console.error('JWT Verify Error:', err);
    cookies().set('session_token', '', { maxAge: -1, path: '/' });
    return { isAdmin: false, userId: null, jabatan: null, response: unauthorizedResponse };
  }
}

/**
 * Helper untuk memverifikasi token USER BIASA (Donatur/Umum)
 * <-- TAMBAHAN: Fungsi ini diperlukan untuk memperbaiki error 'verifyUser' missing
 */
export async function verifyUser(request: NextRequest): Promise<UserAuthResult> {
  const tokenCookie = cookies().get('session_token');
  const unauthorizedResponse = NextResponse.json({ message: 'Tidak terautentikasi' }, { status: 401 });

  if (!tokenCookie) {
    return { isAuthenticated: false, userId: null, role: null, response: unauthorizedResponse };
  }

  try {
    const token = tokenCookie.value;
    
    // Hanya verifikasi token valid atau tidak, tanpa cek tabel admin
    const { payload } = await jwtVerify(token, secretKey) as { payload: UserPayload };

    return {
      isAuthenticated: true,
      userId: payload.userId,
      role: payload.role,
      response: unauthorizedResponse,
    };

  } catch (err) {
    console.error('JWT Verify Error (User):', err);
    cookies().set('session_token', '', { maxAge: -1, path: '/' });
    return { isAuthenticated: false, userId: null, role: null, response: unauthorizedResponse };
  }
}