import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

// --- TIDAK ADA PERUBAHAN ---
// File ini tidak melakukan panggilan database,
// jadi tidak perlu diubah.

export async function POST() {
  try {
    cookies().set('session_token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: -1, 
      path: '/',
    });

    return NextResponse.json(
      { message: 'Logout berhasil' },
      { status: 200 }
    );
  } catch (error) {
    console.error('[LOGOUT_POST]', error);
    return NextResponse.json(
      { message: 'Internal Server Error' },
      { status: 500 }
    );
  }
}