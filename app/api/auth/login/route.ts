import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import { SignJWT } from 'jose';
import bcrypt from 'bcryptjs';

const JWT_SECRET = process.env.JWT_SECRET;

export async function POST(request: Request) {
  try {
    const { identifier, password } = await request.json();

    console.log('Login attempt for:', identifier);

    let user = null;

    // --- LANGKAH 1: Cari User berdasarkan EMAIL ---
    const { data: userByEmail } = await supabase
      .from('user')
      .select(`
        *,
        admin ( jabatan )
      `)
      .eq('email', identifier)
      .maybeSingle();

    if (userByEmail) {
      user = userByEmail;
    } 
    else {
      // --- LANGKAH 2: Jika Email tidak ketemu, cari di tabel DONATUR (No Telp) ---
      const { data: donaturData } = await supabase
        .from('donatur')
        .select('id_user')
        .eq('no_telp', identifier)
        .maybeSingle();

      if (donaturData) {
        // Jika ketemu di donatur, ambil data user aslinya berdasarkan ID
        const { data: userByPhone } = await supabase
          .from('user')
          .select(`
            *,
            admin ( jabatan )
          `)
          .eq('id_user', donaturData.id_user)
          .single();
          
        user = userByPhone;
      }
    }

    // --- PENGECEKAN HASIL PENCARIAN ---
    if (!user) {
      console.log('User not found in DB (Email nor Phone)');
      return NextResponse.json({ message: 'User tidak ditemukan' }, { status: 404 });
    }

    // --- LANGKAH 3: Cek Password ---
    if (!user.password) {
        return NextResponse.json({ message: 'Akun ini tidak memiliki password valid' }, { status: 400 });
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return NextResponse.json({ message: 'Password salah' }, { status: 401 });
    }

    // --- LANGKAH 4: Tentukan Role Final (Override 'admin' dengan 'Super Admin' jika ada) ---
    const adminData = Array.isArray(user.admin) ? user.admin[0] : user.admin;
    const specificRole = adminData?.jabatan; // Misal: "Super Admin"
    const finalRole = specificRole ? specificRole : user.role;

    console.log('Login Success. Final Role:', finalRole);

    // --- LANGKAH 5: Buat Token ---
    const secretKey = new TextEncoder().encode(JWT_SECRET);
    const token = await new SignJWT({ 
        userId: user.id_user, 
        role: finalRole, 
        name: user.nama 
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('1d') 
      .sign(secretKey);

    // --- LANGKAH 6: Response ---
    const response = NextResponse.json({
      message: 'Login berhasil',
      user: {
        id: user.id_user,
        nama: user.nama,
        email: user.email,
        role: finalRole,
      },
    });

    response.cookies.set('session_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24, // 1 hari
      path: '/',
    });

    return response;

  } catch (error) {
    console.error('Login system error:', error);
    return NextResponse.json({ message: 'Terjadi kesalahan server' }, { status: 500 });
  }
}