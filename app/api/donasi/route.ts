import { NextResponse, type NextRequest } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import { verifyUser } from '@/lib/auth';
import { snap } from '@/lib/midtrans'; // Import helper Midtrans

interface DonationRequestBody {
  programId: string;
  samarkanNama: boolean;
  donationType: 'uang' | 'barang';
  nominal?: number;
  paymentMethod?: string;
  goods?: { jenis: string; jumlah: string }[];
  deliveryMethod?: 'Self-Delivery' | 'Pick-up';
  pickupAddress?: string;
  pickupDate?: string;
  pickupTimeSlot?: string;
  // --- Tambahan Data Baru (Maps & Catatan) ---
  pickupNotes?: string;
  pickupLat?: number;
  pickupLng?: number;
}

export async function POST(request: NextRequest) {
  const auth = await verifyUser(request);
  if (!auth.isAuthenticated || !auth.userId) {
    return NextResponse.json({ message: 'Akses ditolak: Anda harus login' }, { status: 401 });
  }

  try {
    // 1. Ambil Data Donatur & User untuk data Customer Midtrans
    const { data: donaturData, error: donaturError } = await supabase
      .from('donatur')
      .select('id_donatur, user (nama, email, phone)')
      .eq('id_user', auth.userId)
      .single();

    if (donaturError || !donaturData) {
      return NextResponse.json({ message: 'Data donatur tidak ditemukan' }, { status: 404 });
    }

    // Handle data user (bisa array/object tergantung response join)
    const userData = Array.isArray(donaturData.user) ? donaturData.user[0] : donaturData.user;

    // 2. Proses Body Request
    const body: DonationRequestBody = await request.json();
    const {
      programId, samarkanNama, donationType, nominal,
      goods, deliveryMethod, pickupAddress, pickupDate, pickupTimeSlot,
      pickupNotes, pickupLat, pickupLng // Ambil data baru dari body
    } = body;

    // Persiapan data barang
    const namaBarang = goods ? goods.map(g => g.jenis).join(', ') : null;
    const deskripsiBarang = goods ? goods.map(g => `${g.jenis} (${g.jumlah})`).join('; ') : null;
    
    // Persiapan tanggal jemput
    let tglJemputISO = null;
    if (donationType === 'barang' && deliveryMethod === 'Pick-up' && pickupDate && pickupTimeSlot) {
       const timePart = pickupTimeSlot.split(' - ')[0]; 
       tglJemputISO = `${pickupDate}T${timePart}:00`; 
    }

    // 3. Simpan ke Database (Status Awal: Pending)
    // Memanggil RPC 'submit_donation' yang sudah diupdate dengan parameter baru
    const { data: newDonationId, error: rpcError } = await supabase.rpc('submit_donation', {
      p_id_donatur: donaturData.id_donatur,
      p_id_kegiatan: parseInt(programId),
      p_anonim: samarkanNama,
      p_jenis_donasi: donationType === 'uang' ? 'Uang' : 'Barang',
      p_nominal: donationType === 'uang' ? nominal : null,
      p_metode_pembayaran: donationType === 'uang' ? 'Midtrans' : null, 
      p_nama_barang: donationType === 'barang' ? namaBarang : null,
      p_deskripsi_barang: donationType === 'barang' ? deskripsiBarang : null,
      p_metode_pengiriman: donationType === 'barang' ? deliveryMethod : null,
      p_alamat_jemput: pickupAddress || null,
      p_tanggal_jemput: tglJemputISO || null,
      p_jam_jemput: pickupTimeSlot || null,
      // Parameter Baru
      p_catatan_donatur: pickupNotes || null,
      p_latitude: pickupLat || null,
      p_longitude: pickupLng || null
    });

    if (rpcError) throw rpcError;

    // 4. INTEGRASI MIDTRANS (Khusus Donasi Uang)
    let snapToken = null;

    if (donationType === 'uang' && nominal) {
        // Buat parameter transaksi Midtrans
        const parameter = {
            transaction_details: {
                // Order ID unik: DONASI-[ID]-[TIMESTAMP]
                order_id: `DONASI-${newDonationId}-${Math.floor(Date.now() / 1000)}`, 
                gross_amount: nominal,
            },
            customer_details: {
                first_name: userData?.nama || 'Donatur',
                email: userData?.email || 'email@example.com',
                phone: userData?.phone || '08123456789',
            },
            item_details: [{
                id: `PROG-${programId}`,
                price: nominal,
                quantity: 1,
                name: `Donasi Program #${programId}`
            }]
        };

        // Minta Token ke Midtrans
        // @ts-ignore
        const transaction = await snap.createTransaction(parameter);
        snapToken = transaction.token;
    }

    return NextResponse.json(
      { 
        message: 'Donasi berhasil dibuat!', 
        donationId: newDonationId,
        snapToken: snapToken // Token ini akan dipakai frontend untuk popup
      },
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