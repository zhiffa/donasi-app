import { NextResponse, type NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify, type JWTPayload } from 'jose';
import { supabase } from '@/lib/supabaseClient';

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET tidak ditemukan di .env.local');
}
const secretKey = new TextEncoder().encode(JWT_SECRET);

interface UserPayload extends JWTPayload {
  userId: number;
  role: string; // <-- Ubah jadi string agar fleksibel
  name: string;
}

interface AuthResult {
  isAdmin: boolean;
  userId: number | null;
  jabatan: 'Admin Program' | 'Admin Operasional' | 'Super Admin' | null;
  response: NextResponse; 
}

interface UserAuthResult {
  isAuthenticated: boolean;
  userId: number | null;
  role: string | null;
  response: NextResponse;
}

// --- VERIFIKASI ADMIN ---
export async function verifyAdmin(request: NextRequest): Promise<AuthResult> {
  const tokenCookie = cookies().get('session_token');
  const unauthorizedResponse = NextResponse.json({ message: 'Tidak terautentikasi' }, { status: 401 });

  if (!tokenCookie) {
    return { isAdmin: false, userId: null, jabatan: null, response: unauthorizedResponse };
  }

  try {
    const token = tokenCookie.value; 
    const { payload } = await jwtVerify(token, secretKey) as { payload: UserPayload };

    // --- PERBAIKAN: Gunakan .includes() agar Super Admin lolos ---
    const isRoleAdmin = payload.role === 'admin' || payload.role.includes('Admin');

    if (!isRoleAdmin) {
      return { 
        isAdmin: false, 
        userId: payload.userId, 
        jabatan: null, 
        response: NextResponse.json({ message: 'Akses ditolak: Bukan admin' }, { status: 403 }) 
      };
    }

    // Ambil JABATAN dari Tabel 'admin'
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
        response: NextResponse.json({ message: 'Data admin tidak ditemukan' }, { status: 403 }) 
      };
    }

    return {
      isAdmin: true,
      userId: payload.userId,
      jabatan: adminData.jabatan as any, // Type casting aman
      response: unauthorizedResponse,
    };

  } catch (err) {
    console.error('JWT Verify Error:', err);
    cookies().set('session_token', '', { maxAge: -1, path: '/' });
    return { isAdmin: false, userId: null, jabatan: null, response: unauthorizedResponse };
  }
}

// --- VERIFIKASI USER BIASA ---
export async function verifyUser(request: NextRequest): Promise<UserAuthResult> {
  const tokenCookie = cookies().get('session_token');
  const unauthorizedResponse = NextResponse.json({ message: 'Tidak terautentikasi' }, { status: 401 });

  if (!tokenCookie) {
    return { isAuthenticated: false, userId: null, role: null, response: unauthorizedResponse };
  }

  try {
    const token = tokenCookie.value;
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