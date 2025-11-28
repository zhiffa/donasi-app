import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import { snap } from '@/lib/midtrans';

// Webhook harus publik (tanpa auth user)
export async function POST(request: Request) {
  try {
    const notificationJson = await request.json();

    // 1. Verifikasi notifikasi dari Midtrans SDK
    // @ts-ignore
    const statusResponse = await snap.transaction.notification(notificationJson);
    
    const orderId = statusResponse.order_id;
    const transactionStatus = statusResponse.transaction_status;
    const fraudStatus = statusResponse.fraud_status;

    console.log(`Midtrans Notification: ${orderId} | Status: ${transactionStatus}`);

    // Extract ID Donasi dari Order ID (Format: DONASI-[ID]-[TIMESTAMP])
    const donationId = orderId.split('-')[1];

    if (!donationId) {
        return NextResponse.json({ message: 'Invalid Order ID' }, { status: 400 });
    }

    // 2. Tentukan Status Baru berdasarkan respon Midtrans
    let newStatus = '';

    if (transactionStatus == 'capture') {
      if (fraudStatus == 'challenge') {
        newStatus = 'Pending'; 
      } else if (fraudStatus == 'accept') {
        newStatus = 'Diterima';
      }
    } else if (transactionStatus == 'settlement') {
      // Uang sudah masuk (Sukses)
      newStatus = 'Diterima';
    } else if (transactionStatus == 'cancel' || transactionStatus == 'deny' || transactionStatus == 'expire') {
      // Gagal / Kadaluarsa
      newStatus = 'Ditolak'; 
    } else if (transactionStatus == 'pending') {
      newStatus = 'Pending';
    }

    // 3. Update Database Supabase
    if (newStatus === 'Diterima' || newStatus === 'Ditolak') {
        const { error } = await supabase
            .from('donasi')
            .update({ 
                status: newStatus,
                // Jika ditolak sistem, simpan alasannya
                rejection_reason: newStatus === 'Ditolak' ? `Pembayaran ${transactionStatus}` : null
            })
            .eq('id_donasi', donationId);

        if (error) {
            console.error('Gagal update status donasi:', error);
            throw error;
        }
    }

    return NextResponse.json({ message: 'OK' });

  } catch (error) {
    console.error('[MIDTRANS_WEBHOOK_ERROR]', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}