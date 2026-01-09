'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Loader2, Download } from 'lucide-react'

import MyDonationStatus from '@/components/MyDonationStatus'
import DonasiMasuk from '@/components/DonasiMasuk'
import PengeluaranDana from '@/components/PengeluaranDana'

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
      const timestamp = Date.now();
      // Mengambil data dari kedua API secara paralel
      const [resDonasi, resPengeluaran] = await Promise.all([
        fetch(`/api/public/donations/${programId}?t=${timestamp}`),
        fetch(`/api/public/expenses/${programId}?t=${timestamp}`)
      ]);

      const dataDonasi = resDonasi.ok ? await resDonasi.json() : [];
      const dataPengeluaran = resPengeluaran.ok ? await resPengeluaran.json() : [];

      // 1. Format Donasi (Masuk)
      const formatDonasi = dataDonasi.map((d: any) => ({
        tanggal: new Date(d.tanggal).toLocaleDateString('id-ID'),
        kategori: 'MASUK',
        uraian: d.nama || 'Hamba Allah',
        nominal: d.jenis === 'Uang' ? (Number(d.nominal) || 0) : 0,
        keterangan: d.jenis === 'Barang' ? `${d.nama_barang} (${d.deskripsi_barang || ''})` : 'Donasi Uang'
      }));

      // 2. Format Pengeluaran (Keluar) - Sesuai field database: deskripsi, nominal, item_details
      const formatPengeluaran = dataPengeluaran.map((e: any) => ({
        tanggal: new Date(e.tanggal).toLocaleDateString('id-ID'),
        kategori: 'KELUAR',
        uraian: e.deskripsi,
        nominal: e.type === 'uang' ? (Number(e.nominal) || 0) : 0,
        keterangan: e.type === 'barang' ? (e.item_details || '-') : 'Penggunaan Dana'
      }));

      // 3. Gabungkan dan Urutkan
      const gabungan = [...formatDonasi, ...formatPengeluaran];

      // 4. Bangun CSV
      const headers = ['Tanggal', 'Kategori', 'Uraian/Nama', 'Nominal (Rp)', 'Keterangan/Barang'];
      const rows = gabungan.map(item => [
        item.tanggal,
        item.kategori,
        `"${item.uraian.replace(/"/g, '""')}"`,
        item.nominal,
        `"${item.keterangan.replace(/"/g, '""')}"`
      ].join(','));

      const csvContent = [headers.join(','), ...rows].join('\n');
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
      alert("Gagal mengekspor data.");
    } finally {
      setIsExporting(false);
    }
  };

  if (loading) return <div className="flex h-screen items-center justify-center bg-gray-100"><Loader2 className="animate-spin text-blue-500" /></div>;

  return (
    <div className="bg-gray-100 min-h-screen p-4 md:p-8">
      <div className="container mx-auto max-w-7xl">
        
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
          <button onClick={() => router.push('/')} className="flex items-center text-gray-600 hover:text-gray-900 font-medium transition">
            <ArrowLeft className="w-5 h-5 mr-2" /> Kembali ke Beranda
          </button>

          <button 
            onClick={exportToCSV}
            disabled={isExporting}
            className="flex items-center justify-center bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-lg text-sm font-bold shadow-md disabled:opacity-50"
          >
            {isExporting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
            Export CSV
          </button>
        </div>

        <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2">Laporan Real-Time</h1>
        <p className="text-xl text-blue-600 font-semibold mb-8">Program: {programName}</p>

        <MyDonationStatus programId={programId} />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
          <DonasiMasuk programId={programId} />
          <PengeluaranDana programId={programId} />
        </div>
        
        <div className="mt-12 text-center">
          <Link href="/history" className="inline-block bg-blue-600 text-white font-bold py-3 px-8 rounded-full hover:bg-blue-700 transition shadow-lg">
            Lihat Semua Riwayat Saya
          </Link>
        </div>
      </div>
    </div>
  )
}