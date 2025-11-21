import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import bcrypt from 'bcryptjs';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name: nama, email, phone, password } = body;

    if (!nama || !email || !phone || !password) {
      return NextResponse.json(
        { message: 'Semua field harus diisi' },
        { status: 400 }
      );
    }

    // 1. Cek apakah email/telepon sudah ada
    const { data: existingUser, error: checkError } = await supabase
      .from('user')
      .select('id_user')
      .or(`email.eq.${email},phone.eq.${phone}`);

    if (checkError) throw checkError;

    if (existingUser.length > 0) {
      return NextResponse.json(
        { message: 'Email atau nomor telepon sudah terdaftar' },
        { status: 409 }
      );
    }

    // 2. Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // 3. Simpan ke tabel 'user' DAN ambil ID barunya
    const { data: newUser, error: insertUserError } = await supabase
      .from('user')
      .insert({
        nama: nama,
        email: email,
        phone: phone,
        password: hashedPassword,
        role: 'donatur'
      })
      .select() // <-- PENTING: Agar kita dapat data user yang baru dibuat
      .single();
      
    if (insertUserError) throw insertUserError;

    // 4. --- PERBAIKAN UTAMA: BUAT PROFIL DONATUR OTOMATIS ---
    // Tanpa langkah ini, user bisa login tapi tidak bisa donasi
    const { error: insertDonaturError } = await supabase
      .from('donatur')
      .insert({
        id_user: newUser.id_user, // Sambungkan dengan ID user yang baru dibuat
        no_telp: phone,
        alamat: '-' // Isi alamat default, nanti diupdate saat donasi
      });

    if (insertDonaturError) {
        console.error('Gagal membuat profil donatur:', insertDonaturError);
        throw insertDonaturError;
    }
    // ---------------------------------------------------------

    return NextResponse.json(
      { message: 'Registrasi berhasil' },
      { status: 201 }
    );
  } catch (error) {
    console.error('[REGISTER_POST]', error);
    
    // Handle error duplikat secara spesifik
    if (typeof error === 'object' && error !== null && 'code' in error) {
      const supabaseError = error;
      if (supabaseError.code === '23505') { // Kode error unique violation PostgreSQL
         return NextResponse.json(
          { message: 'Email atau nomor telepon sudah terdaftar' },
          { status: 409 }
        );
      }
    }
    
    return NextResponse.json(
      { message: 'Internal Server Error' },
      { status: 500 }
    );
  }
}