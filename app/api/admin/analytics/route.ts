import { NextResponse, type NextRequest } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import { verifyAdmin } from '@/lib/auth';

// Pastikan selalu dynamic agar data tidak di-cache statis oleh Next.js
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  // 1. Cek Admin
  const auth = await verifyAdmin(request);
  if (!auth.isAdmin) return auth.response;

  try {
    // 2. Ambil SEMUA data secara paralel (Biar loading dashboard ngebut)
    const [
      donasiRes,
      userRes,
      kegiatanRes,
      jadwalRes,
      donaturRes
    ] = await Promise.all([
      // A. Ambil semua donasi (untuk hitung total uang, barang pending, tren, pie chart)
      supabase.from('donasi').select('nominal, jenis_donasi, status, created_at, metode_pengiriman'),
      
      // B. Hitung total user yang role-nya donatur
      supabase.from('user').select('id_user', { count: 'exact', head: true }).eq('role', 'donatur'),
      
      // C. Ambil data kegiatan (untuk statistik event aktif)
      supabase.from('kegiatan').select('status'),

      // D. Ambil jadwal penjemputan (untuk status tracking barang pickup)
      supabase.from('jadwal_penjemputan').select('status_penjemputan'),

      // E. Ambil ID donatur yang donasinya sukses (untuk hitung donatur aktif unik)
      supabase.from('donasi').select('id_donatur').eq('status', 'Diterima')
    ]);

    // Cek error basic
    if (donasiRes.error) throw donasiRes.error;

    const allDonations = donasiRes.data || [];
    
    // --- 3. PENGOLAHAN DATA STATISTIK UTAMA ---

    // Total Uang (Hanya yang status Diterima)
    const totalDonations = allDonations
      .filter(d => d.jenis_donasi === 'Uang' && d.status === 'Diterima')
      .reduce((acc, curr) => acc + (curr.nominal || 0), 0);

    // Total User Terdaftar
    const totalUsers = userRes.count || 0;

    // To Do List (Barang Pending) - Perlu verifikasi admin
    const todoListCount = allDonations.filter(d => d.jenis_donasi === 'Barang' && d.status === 'Pending').length;

    // Statistik Event
    const events = kegiatanRes.data || [];
    const ongoingEvents = events.filter(e => e.status === 'Aktif').length;
    const totalEvents = events.length;

    // Statistik Donatur Aktif (Unik)
    const donorIds = donaturRes.data?.map(d => d.id_donatur) || [];
    const totalDonors = new Set(donorIds).size; // Set membersihkan duplikat ID

    // --- 4. STATISTIK TRACKING PENGIRIMAN ---
    
    const jadwalList = jadwalRes.data || [];
    
    // Hitung Self Delivery yang masih Pending
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

    // --- 5. LOGIKA GRAFIK TREN (30 HARI TERAKHIR) ---
    
    const daysCount = 30; // Request kamu: 1 Bulan
    
    // Bikin array tanggal mundur 30 hari ke belakang
    const last30Days = [...Array(daysCount)].map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      return d.toISOString().split('T')[0]; // Format: YYYY-MM-DD
    }).reverse(); // Dibalik biar urut dari tanggal lama ke baru

    const trendData = last30Days.map(date => {
      // Filter donasi uang diterima pada tanggal tersebut
      const dailyTotal = allDonations
        .filter(d => 
          d.jenis_donasi === 'Uang' && 
          d.status === 'Diterima' && 
          d.created_at.startsWith(date) // Mencocokkan tanggal YYYY-MM-DD
        )
        .reduce((acc, curr) => acc + (curr.nominal || 0), 0);
      
      // Format label tanggal (misal: "17/12") biar muat di grafik HP
      const dObj = new Date(date);
      const dateLabel = `${dObj.getDate()}/${dObj.getMonth() + 1}`; 
      
      return { 
          name: dateLabel, 
          total: dailyTotal,
          fullDate: date // Simpan tanggal lengkap kalau nanti butuh tooltip detail
      };
    });

    // --- 6. LOGIKA PIE CHART (KOMPOSISI) ---
    // Kita hitung berdasarkan FREKUENSI (Jumlah Transaksi)
    const uangCount = allDonations.filter(d => d.jenis_donasi === 'Uang').length;
    const barangCount = allDonations.filter(d => d.jenis_donasi === 'Barang').length;
    
    const pieData = [
      { name: 'Uang', value: uangCount },
      { name: 'Barang', value: barangCount },
    ];

    // --- 7. RETURN RESPONSE ---
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