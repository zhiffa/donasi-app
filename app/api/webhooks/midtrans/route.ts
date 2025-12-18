import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import { snap } from '@/lib/midtrans';
import { revalidatePath } from 'next/cache';

export async function POST(request: Request) {
  try {
    const notificationJson = await request.json();
    
    // 1. Verifikasi notifikasi resmi dari Midtrans SDK
    // @ts-ignore
    const statusResponse = await snap.transaction.notification(notificationJson);
    
    const orderId = statusResponse.order_id;
    const transactionStatus = statusResponse.transaction_status;
    const fraudStatus = statusResponse.fraud_status;

    // Extract ID Donasi (Format: DONASI-[ID]-[TIMESTAMP])
    const donationId = orderId.split('-')[1];

    if (!donationId) {
      return NextResponse.json({ message: 'Invalid Order ID' }, { status: 400 });
    }

    // Ambil data donasi untuk mendapatkan id_kegiatan (untuk revalidasi path)
    const { data: donationData } = await supabase
        .from('donasi')
        .select('id_kegiatan')
        .eq('id_donasi', donationId)
        .single();

    let newStatus = '';
    if (transactionStatus === 'settlement' || (transactionStatus === 'capture' && fraudStatus === 'accept')) {
      newStatus = 'Diterima';
    } else if (['cancel', 'deny', 'expire'].includes(transactionStatus)) {
      newStatus = 'Ditolak'; 
    }

    // 2. Eksekusi Update Status ke Database
    if (newStatus === 'Diterima' || newStatus === 'Ditolak') {
        const { error } = await supabase
            .from('donasi')
            .update({ 
                status: newStatus,
                updated_at: new Date().toISOString()
            })
            .eq('id_donasi', donationId);

        if (error) {
            console.error('Database Update Error:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        // 3. REVALIDASI ON-DEMAND
        // Menghapus cache agar data di Server Components terupdate otomatis
        
        // Update Landing Page (Progressive Bar Utama)
        revalidatePath('/'); 

        if (donationData?.id_kegiatan) {
            // Update Halaman Detail Program
            revalidatePath(`/programs/${donationData.id_kegiatan}`);
            
            // Update Halaman Live Report
            revalidatePath(`/live-reports/${donationData.id_kegiatan}`);
        }

        console.log(`Revalidation success for Program: ${donationData?.id_kegiatan}`);
    }

    return NextResponse.json({ message: 'OK' });
  } catch (error) {
    console.error('[MIDTRANS_WEBHOOK_ERROR]', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}