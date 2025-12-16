import { NextResponse, type NextRequest } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import { verifyAdmin } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const auth = await verifyAdmin(request);
  if (!auth.isAdmin) return auth.response;

  try {
    // Gunakan Promise.all agar semua query jalan barengan (lebih cepat)
    const [
      donasiRes,
      userRes,
      kegiatanRes,
      jadwalRes,
      donaturRes
    ] = await Promise.all([
      // 1. Ambil semua donasi
      // Tambahkan 'nomor_resi' untuk kelengkapan data jika nanti dibutuhkan
      supabase.from('donasi').select('nominal, jenis_donasi, status, created_at, metode_pengiriman, nomor_resi'),
      
      // 2. Hitung total user (role donatur)
      supabase.from('user').select('id_user', { count: 'exact', head: true }).eq('role', 'donatur'),
      
      // 3. Ambil data kegiatan (untuk status)
      supabase.from('kegiatan').select('status'),

      // 4. Ambil jadwal penjemputan (untuk status tracking barang pickup)
      supabase.from('jadwal_penjemputan').select('status_penjemputan'),

      // 5. Hitung user yang PERNAH donasi (status Diterima) - Distinct count
      // Karena Supabase basic tidak support .distinct() langsung di count, kita ambil ID-nya saja lalu set di JS
      supabase.from('donasi').select('id_donatur').eq('status', 'Diterima')
    ]);

    if (donasiRes.error) throw donasiRes.error;

    const allDonations = donasiRes.data || [];
    
    // --- 1. Total Donations (Uang Masuk - Status Diterima) ---
    const totalDonations = allDonations
      .filter(d => d.jenis_donasi === 'Uang' && d.status === 'Diterima')
      .reduce((acc, curr) => acc + (curr.nominal || 0), 0);

    // --- 2. Total User (Yang daftar) ---
    const totalUsers = userRes.count || 0;

    // --- 3. To Do List (Donasi Barang Pending) ---
    // Mencakup semua donasi barang yang belum diterima/ditolak (baik pickup maupun self-delivery)
    const todoListCount = allDonations.filter(d => d.jenis_donasi === 'Barang' && d.status === 'Pending').length;

    // --- 4 & 5. Event Stats ---
    const events = kegiatanRes.data || [];
    const ongoingEvents = events.filter(e => e.status === 'Aktif').length;
    const totalEvents = events.length; // Semua event (termasuk selesai/draft)

    // --- 6. Total Active Donors ---
    const donorIds = donaturRes.data?.map(d => d.id_donatur) || [];
    const totalDonors = new Set(donorIds).size; // Hitung unique ID

    // --- 7. Donation Status (Barang Tracking) ---
    const jadwalList = jadwalRes.data || [];
    
    // Hitung Self Delivery
    // Logika: Barang + Self-Delivery + Status Pending
    // Ini mencakup user yang sudah input resi ATAU belum, asalkan statusnya masih Pending (belum diterima admin)
    const selfDeliveryCount = allDonations.filter(d => 
        d.jenis_donasi === 'Barang' && 
        d.metode_pengiriman === 'Self-Delivery' && 
        d.status === 'Pending'
    ).length;

    const trackingStats = {
      dijadwalkan: jadwalList.filter(j => j.status_penjemputan === 'Dijadwalkan').length,
      diantar: jadwalList.filter(j => j.status_penjemputan === 'Dalam Perjalanan').length,
      selesai: jadwalList.filter(j => j.status_penjemputan === 'Selesai').length,
      selfDelivery: selfDeliveryCount
    };

    // --- GRAFIK 1: Tren Donasi (7 Hari Terakhir) ---
    // Kita kelompokkan data 'Uang' 'Diterima' berdasarkan tanggal
    const last7Days = [...Array(7)].map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      return d.toISOString().split('T')[0]; // Format YYYY-MM-DD
    }).reverse();

    const trendData = last7Days.map(date => {
      const dailyTotal = allDonations
        .filter(d => 
          d.jenis_donasi === 'Uang' && 
          d.status === 'Diterima' && 
          d.created_at.startsWith(date)
        )
        .reduce((acc, curr) => acc + (curr.nominal || 0), 0);
      
      // Format tanggal biar cantik (misal: "10 Nov")
      const dateLabel = new Date(date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
      return { name: dateLabel, total: dailyTotal };
    });

    // --- GRAFIK 2: Pie Chart (Uang vs Barang) ---
    // Hitung berdasarkan frekuensi transaksi (bukan nominal)
    const uangCount = allDonations.filter(d => d.jenis_donasi === 'Uang').length;
    const barangCount = allDonations.filter(d => d.jenis_donasi === 'Barang').length;
    
    const pieData = [
      { name: 'Uang', value: uangCount },
      { name: 'Barang', value: barangCount },
    ];

    // Response Akhir
    return NextResponse.json({
      totalDonations,
      totalUsers,
      todoListCount,
      ongoingEvents,
      totalEvents,
      totalDonors,
      trackingStats, 
      trendData,
      pieData
    }, { status: 200 });

  } catch (error: any) {
    console.error('[ANALYTICS_ERROR]', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}