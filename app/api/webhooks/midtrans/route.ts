import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import { snap } from '@/lib/midtrans';
import { revalidatePath } from 'next/cache'; // Pastikan import ini ada

export async function POST(request: Request) {
  try {
    const notificationJson = await request.json();
    // @ts-ignore
    const statusResponse = await snap.transaction.notification(notificationJson);
    
    const orderId = statusResponse.order_id;
    const transactionStatus = statusResponse.transaction_status;
    const fraudStatus = statusResponse.fraud_status;

    const donationId = orderId.split('-')[1];

    if (!donationId) {
        return NextResponse.json({ message: 'Invalid Order ID' }, { status: 400 });
    }

    // --- LOGIKA MENDAPATKAN ID KEGIATAN ---
    // Kita butuh ID Kegiatan untuk revalidate path detail program
    // Ambil data donasi sebentar untuk tahu ini donasi buat program apa
    const { data: donationData } = await supabase
        .from('donasi')
        .select('id_kegiatan')
        .eq('id_donasi', donationId)
        .single();

    let newStatus = '';
    // ... (logika penentuan status sama seperti sebelumnya)
    if (transactionStatus == 'settlement' || (transactionStatus == 'capture' && fraudStatus == 'accept')) {
      newStatus = 'Diterima';
    } else if (['cancel', 'deny', 'expire'].includes(transactionStatus)) {
      newStatus = 'Ditolak'; 
    }

    if (newStatus === 'Diterima' || newStatus === 'Ditolak') {
        const { error } = await supabase
            .from('donasi')
            .update({ status: newStatus })
            .eq('id_donasi', donationId);

        if (!error) {
            // 1. Revalidasi Halaman Beranda (ActivePrograms)
            revalidatePath('/'); 

            // 2. Revalidasi Halaman Detail Program
            if (donationData?.id_kegiatan) {
                revalidatePath(`/programs/${donationData.id_kegiatan}`);
                // URL live report
                revalidatePath(`/live-reports/${donationData.id_kegiatan}`);
            }

            console.log(`Revalidated paths for program: ${donationData?.id_kegiatan}`);
        }
    }

    return NextResponse.json({ message: 'OK' });
  } catch (error) {
    console.error('[MIDTRANS_WEBHOOK_ERROR]', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}