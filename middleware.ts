import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose'; 

// Dapatkan secret key dari .env.local
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET tidak ditemukan di .env.local');
}
const secretKey = new TextEncoder().encode(JWT_SECRET);

// Tipe data payload dari JWT
interface UserPayload {
  userId: number;
  role: string; // <-- UBAH KE STRING (Supaya bisa terima 'Super Admin', 'Admin Program', dll)
  iat: number;
  exp: number;
}

export async function middleware(request: NextRequest) {
  // 1. Dapatkan path yang diminta
  const { pathname } = request.nextUrl;

  // 2. Kita hanya ingin melindungi rute /admin
  if (pathname.startsWith('/admin')) {
    // 3. Ambil token dari cookie
    const tokenCookie = request.cookies.get('session_token');

    if (!tokenCookie) {
      // Jika tidak ada token, paksa redirect ke /login
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname); 
      return NextResponse.redirect(loginUrl);
    }

    try {
      // 4. Verifikasi token
      const { payload } = await jwtVerify(tokenCookie.value, secretKey) as { payload: UserPayload };
      
      const userRole = payload.role;

      // --- PERBAIKAN LOGIKA DI SINI ---
      // Cek apakah role adalah 'admin' (lama) ATAU mengandung kata 'Admin' (baru)
      // Contoh: 'Super Admin', 'Admin Program', 'Admin Operasional' akan lolos karena ada kata 'Admin'
      const isAdmin = userRole === 'admin' || userRole.includes('Admin');

      if (!isAdmin) {
        // Jika BUKAN admin, lempar ke halaman utama
        return NextResponse.redirect(new URL('/', request.url));
      }

      // 6. Jika token valid DAN rolenya admin, biarkan lanjut
      return NextResponse.next();

    } catch (err) {
      // Token tidak valid (expired atau salah)
      console.error('Middleware JWT Error:', err);
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // Biarkan semua rute lain (selain /admin) lolos
  return NextResponse.next();
}

// Konfigurasi: Tentukan rute mana yang harus dijalankan middleware ini
export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};