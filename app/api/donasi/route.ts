import { NextResponse, type NextRequest } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import { verifyUser } from '@/lib/auth';

interface DonationRequestBody {
  programId: string;
  samarkanNama: boolean;
  donationType: 'uang' | 'barang';
  // Uang
  nominal?: number;
  paymentMethod?: string;
  // Barang
  goods?: { jenis: string; jumlah: string }[];
  deliveryMethod?: 'Self-Delivery' | 'Pick-up'; // Sesuaikan dengan ENUM DB
  // Pick-up
  pickupAddress?: string;
  pickupDate?: string;
  pickupTimeSlot?: string;
}

export async function POST(request: NextRequest) {
  // 1. Verifikasi User
  const auth = await verifyUser(request);
  if (!auth.isAuthenticated || !auth.userId) {
    return NextResponse.json({ message: 'Akses ditolak: Anda harus login' }, { status: 401 });
  }

  try {
    // 2. Dapatkan id_donatur
    const { data: donaturData, error: donaturError } = await supabase
      .from('donatur')
      .select('id_donatur')
      .eq('id_user', auth.userId)
      .single();

    if (donaturError || !donaturData) {
      return NextResponse.json({ message: 'Data donatur tidak ditemukan' }, { status: 404 });
    }

    // 3. Proses data body
    const body: DonationRequestBody = await request.json();
    const {
      programId,
      samarkanNama,
      donationType,
      nominal,
      paymentMethod,
      goods,
      deliveryMethod,
      pickupAddress,
      pickupDate,
      pickupTimeSlot
    } = body;

    // Persiapan data barang (gabungkan array menjadi string)
    const namaBarang = goods ? goods.map(g => g.jenis).join(', ') : null;
    const deskripsiBarang = goods ? goods.map(g => `${g.jenis} (${g.jumlah})`).join('; ') : null;

    // Persiapan Tanggal Jemput (Gabungkan Date & Time untuk format Timestamp)
    let tglJemputISO = null;
    if (donationType === 'barang' && deliveryMethod === 'Pick-up' && pickupDate && pickupTimeSlot) {
       // Ambil jam awal, misal "09:00 - 12:00" -> ambil "09:00"
       const timePart = pickupTimeSlot.split(' - ')[0]; 
       // Gabungkan jadi ISO string (YYYY-MM-DDTHH:mm:ss)
       // Note: Kita asumsikan input lokal, tambah 'Z' atau offset jika perlu
       tglJemputISO = `${pickupDate}T${timePart}:00`; 
    }

    // 4. Panggil RPC 'submit_donation' (Transaksi Database)
    const { data: newDonationId, error: rpcError } = await supabase.rpc('submit_donation', {
      p_id_donatur: donaturData.id_donatur,
      p_id_kegiatan: parseInt(programId),
      p_anonim: samarkanNama,
      p_jenis_donasi: donationType === 'uang' ? 'Uang' : 'Barang', // Sesuaikan Case Enum
      p_nominal: donationType === 'uang' ? nominal : null,
      p_metode_pembayaran: donationType === 'uang' ? paymentMethod : null,
      p_nama_barang: donationType === 'barang' ? namaBarang : null,
      p_deskripsi_barang: donationType === 'barang' ? deskripsiBarang : null,
      p_metode_pengiriman: donationType === 'barang' ? deliveryMethod : null,
      // Parameter Pick-up
      p_alamat_jemput: pickupAddress || null,
      p_tanggal_jemput: tglJemputISO || null,
      p_jam_jemput: pickupTimeSlot || null
    });

    if (rpcError) {
       console.error('[RPC_ERROR]', rpcError);
       throw rpcError;
    }

    return NextResponse.json(
      { message: 'Donasi berhasil dikirim! Terima kasih atas kebaikan Anda.', donationId: newDonationId },
      { status: 201 }
    );

  } catch (error: any) {
    console.error('[DONATION_POST]', error);
    return NextResponse.json(
      { message: `Internal Server Error: ${error.message || 'Unknown'}` },
      { status: 500 }
    );
  }
}