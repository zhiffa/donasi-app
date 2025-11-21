import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import bcrypt from 'bcryptjs';
import { SignJWT } from 'jose';
import { cookies } from 'next/headers';

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET tidak ditemukan di .env.local');
}
const secretKey = new TextEncoder().encode(JWT_SECRET);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { identifier, password } = body;

    if (!identifier || !password) {
      return NextResponse.json(
        { message: 'Email/Nomor telepon dan password harus diisi' },
        { status: 400 }
      );
    }

    // Panggil RPC
    // Supabase RPC mengembalikan Array jika return-nya TABLE
    const { data, error: rpcError } = await supabase
      .rpc('login_user', { p_identifier: identifier });
      
    if (rpcError) {
        console.error('[LOGIN_RPC_ERROR]', rpcError);
        return NextResponse.json(
          { message: 'Terjadi kesalahan saat menghubungi database' },
          { status: 500 }
        );
    }

    // --- PERBAIKAN DI SINI ---
    // Cek apakah data ada DAN apakah array memiliki isi
    if (!data || data.length === 0) {
        return NextResponse.json(
          { message: 'Email/Nomor telepon tidak terdaftar' },
          { status: 404 } // Return 404 agar frontend tahu user tidak ada
        );
    }

    // Ambil item pertama dari array karena RPC mengembalikan [user]
    const user = data[0]; 
    // --- AKHIR PERBAIKAN ---

    // Verifikasi password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return NextResponse.json({ message: 'Password salah' }, { status: 401 });
    }

    // Buat Token JWT
    const token = await new SignJWT({
      userId: user.id_user,
      role: user.role,
      name: user.nama,
      jabatan: user.jabatan || null,
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('1h')
      .sign(secretKey);

    cookies().set('session_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60,
      path: '/',
    });

    const { password: dbPassword, ...userWithoutPassword } = user;

    return NextResponse.json(
      {
        message: 'Login berhasil',
        user: userWithoutPassword,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[LOGIN_POST]', error);
    return NextResponse.json(
      { message: 'Internal Server Error' },
      { status: 500 }
    );
  }
}