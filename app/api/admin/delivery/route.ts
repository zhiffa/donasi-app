import { NextResponse, type NextRequest } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import { verifyAdmin } from '@/lib/auth';

export async function PATCH(request: NextRequest) {
  const auth = await verifyAdmin(request);
  if (!auth.isAdmin) return auth.response;

  try {
    const { donationId, status } = await request.json();

    if (!donationId || !status) {
      return NextResponse.json({ message: 'Data tidak lengkap' }, { status: 400 });
    }

    // 1. Cek Jenis Pengiriman Donasi ini
    const { data: donation, error: fetchError } = await supabase
        .from('donasi')
        .select('metode_pengiriman')
        .eq('id_donasi', donationId)
        .single();
    
    if (fetchError || !donation) throw new Error('Donasi tidak ditemukan');

    // 2. LOGIKA UPDATE
    if (donation.metode_pengiriman === 'Self-Delivery') {
        // --- KASUS SELF-DELIVERY ---
        // Kita "Upsert" (Insert or Update) ke tabel jadwal
        // Kita isi kolom NOT NULL dengan data default
        const { error } = await supabase
            .from('jadwal_penjemputan')
            .upsert({
                id_donasi: donationId,
                status_penjemputan: status, // 'Selesai' atau 'Batal'
                alamat_penjemputan: 'Diantar ke Yayasan (Self-Delivery)', // Default
                tanggal_penjemputan: new Date().toISOString(), // Default Now
            }, { onConflict: 'id_donasi' });

        if (error) throw error;

    } else {
        // --- KASUS PICK-UP ---
        // Update row yang sudah ada
        const { error } = await supabase
            .from('jadwal_penjemputan')
            .update({ status_penjemputan: status })
            .eq('id_donasi', donationId);
        
        if (error) throw error;
    }

    return NextResponse.json({ message: 'Status logistik berhasil diupdate' }, { status: 200 });

  } catch (error: any) {
    console.error('[DELIVERY_UPDATE]', error);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}