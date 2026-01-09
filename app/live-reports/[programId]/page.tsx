'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Loader2, Download } from 'lucide-react'

import MyDonationStatus from '@/components/MyDonationStatus'
import DonasiMasuk from '@/components/DonasiMasuk'
import PengeluaranDana from '@/components/PengeluaranDana'

// Definisi tipe untuk gabungan data agar rapi
interface GabunganTransaksi {
  tanggal: Date;
  kategori: 'MASUK' | 'KELUAR';
  uraian: string;
  tipe_aset: string; // 'Uang' atau 'Barang'
  masuk: number;
  keluar: number;
  keterangan: string;
}

export default function LiveReportPage({ params }: { params: { programId: string } }) {
  const router = useRouter();
  const { programId } = params;

  const [programName, setProgramName] = useState('');
  const [loading, setLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    if (programId) {
      async function fetchProgramData() {
        try {
          const res = await fetch(`/api/kegiatan/${programId}`);
          if (!res.ok) throw new Error('Program tidak ditemukan');
          const data = await res.json();
          setProgramName(data.nama_program);
        } catch (err) {
          console.error(err);
          setProgramName('Program Tidak Ditemukan');
        } finally {
          setLoading(false);
        }
      }
      fetchProgramData();
    }
  }, [programId]);

  const exportToCSV = async () => {
    setIsExporting(true);
    try {
      // 1. Ambil data dari kedua API (sesuai route yang ada di komponen kamu)
      const timestamp = Date.now();
      const [resDonasi, resPengeluaran] = await Promise.all([
        fetch(`/api/public/donations/${programId}?t=${timestamp}`),
        fetch(`/api/public/expenses/${programId}?t=${timestamp}`)
      ]);

      const dataDonasi = resDonasi.ok ? await resDonasi.json() : [];
      const dataPengeluaran = resPengeluaran.ok ? await resPengeluaran.json() : [];

      // 2. Format Data Donasi (Masuk)
      const formatDonasi: GabunganTransaksi[] = dataDonasi.map((d: any) => ({
        tanggal: new Date(d.tanggal),
        kategori: 'MASUK',
        uraian: d.nama || 'Hamba Allah',
        tipe_aset: d.jenis,
        masuk: d.jenis === 'Uang' ? (Number(d.nominal) || 0) : 0,
        keluar: 0,
        keterangan: d.jenis === 'Barang' ? `${d.nama_barang} (${d.deskripsi_barang || '-'})` : 'Donasi Uang'
      }));

      // 3. Format Data Pengeluaran (Keluar)
      const formatPengeluaran: GabunganTransaksi[] = dataPengeluaran.map((e: any) => ({
        tanggal: new Date(e.tanggal),
        kategori: 'KELUAR',
        uraian: e.deskripsi,
        tipe_aset: e.type,
        masuk: 0,
        keluar: e.type === 'uang' ? (Number(e.nominal) || 0) : 0,
        keterangan: e.type === 'barang' ? (e.item_details || '-') : 'Penggunaan Dana'
      }));

      // 4. Gabungkan dan Urutkan
      const gabungan = [...formatDonasi, ...formatPengeluaran].sort(
        (a, b) => b.tanggal.getTime() - a.tanggal.getTime()
      );

      // 5. Bangun Konten CSV
      const headers = ['Tanggal', 'Kategori', 'Uraian', 'Jenis', 'Masuk (Rp)', 'Keluar (Rp)', 'Detail/Keterangan'];
      const rows = gabungan.map(item => [
        item.tanggal.toLocaleDateString('id-ID'),
        item.kategori,
        `"${item.uraian.replace(/"/g, '""')}"`,
        item.tipe_aset.toUpperCase(),
        item.masuk,
        item.keluar,
        `"${item.keterangan.replace(/"/g, '""')}"`
      ].join(','));

      const csvContent = [headers.join(','), ...rows].join('\n');

      // 6. Download proses
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Laporan_${programName.replace(/\s+/g, '_')}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

    } catch (error) {
      console.error("Export error:", error);
      alert("Gagal mengunduh data.");
    } finally {
      setIsExporting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-100">
        <Loader2 className="h-12 w-12 animate-spin text-gray-500" />
      </div>
    );
  }

  return (
    <div className="bg-gray-100 min-h-screen p-4 md:p-8">
      <div className="container mx-auto max-w-7xl">
        
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
          <button
            onClick={() => router.push('/')}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-2 font-medium transition"
          >
            <ArrowLeft className="w-5 h-5 mr-2" /> Kembali ke Beranda
          </button>

          <button
            onClick={exportToCSV}
            disabled={isExporting}
            className="flex items-center justify-center bg-green-600 hover:bg-green-700 text-white px-6 py-2.5 rounded-xl font-bold transition-all shadow-md active:scale-95 disabled:opacity-50"
          >
            {isExporting ? (
              <Loader2 className="w-5 h-5 animate-spin mr-2" />
            ) : (
              <Download className="w-5 h-5 mr-2" />
            )}
            Export Laporan (CSV)
          </button>
        </div>

        <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2">
          Laporan Real-Time
        </h1>
        <p className="text-xl text-blue-600 font-semibold mb-8">
          Program: {programName}
        </p>

        <MyDonationStatus programId={programId} />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
          <DonasiMasuk programId={programId} />
          <PengeluaranDana programId={programId} />
        </div>
        
        <div className="mt-12 text-center">
          <Link
            href="/history"
            className="inline-block bg-blue-600 text-white font-bold py-3 px-8 rounded-full text-lg hover:bg-blue-700 transition-colors shadow-lg"
          >
            Lihat Semua Riwayat Saya
          </Link>
        </div>
      </div>
    </div>
  )
}