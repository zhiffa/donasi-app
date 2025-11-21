import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyAdmin } from '@/lib/auth'; // Helper auth

// --- FUNGSI POST (Menolak donasi) ---
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const auth = await verifyAdmin(request);
  if (!auth.isAdmin || !auth.userId) {
    return auth.response;
  }

  const donationId = params.id; // Ini adalah id_layanan
  const adminId = auth.userId;
  
  // Ambil alasan penolakan dari body
  const { reason } = await request.json();
  if (!reason) {
     return NextResponse.json({ message: 'Alasan penolakan harus diisi' }, { status: 400 });
  }
  
  if (!donationId) {
    return NextResponse.json({ message: 'ID Donasi dibutuhkan' }, { status: 400 });
  }

  try {
    const connection = await db.getConnection(); // Mulai transaksi
    await connection.beginTransaction();

    // 1. Update status di tabel 'layanan'
    await connection.query(
      'UPDATE layanan SET status = ? WHERE id_layanan = ? AND status = ?',
      ['declined', donationId, 'pending'] // Hanya update jika status masih 'pending'
    );

    // 2. Catat di 'rejected_donations' sesuai ERD
    await connection.query(
      'INSERT INTO rejected_donations (id_layanan, rejected_by, rejection_reason) VALUES (?, ?, ?)',
      [donationId, adminId, reason]
    );
    
    await connection.commit(); // Selesaikan transaksi
    connection.release();

    return NextResponse.json(
      { message: 'Donasi berhasil ditolak' },
      { status: 200 }
    );

  } catch (error) {
    console.error('[VERIFY_REJECT_POST]', error);
    return NextResponse.json(
      { message: 'Internal Server Error' },
      { status: 500 }
    );
  }
}