'use client'
import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Wallet, TrendingDown, Package, Calendar } from 'lucide-react'

export default function ProgramReportPage() {
  const { id } = useParams();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'pemasukan' | 'pengeluaran'>('pemasukan');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(`/api/public/programs/${id}/report`);
        const json = await res.json();
        setData(json);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  if (loading) return <div className="p-10 text-center">Memuat Laporan...</div>;
  if (!data) return <div className="p-10 text-center">Data tidak ditemukan</div>;

  const { program, stats, income, expenses } = data;
  const sisaDana = stats.total_uang_masuk - stats.total_pengeluaran;

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <Link href="/" className="inline-flex items-center text-gray-500 hover:text-blue-600 mb-4 transition">
            <ArrowLeft size={16} className="mr-2" /> Kembali ke Beranda
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">{program.nama_program}</h1>
          <p className="text-gray-500 text-sm mt-1">Laporan Transparansi Dana & Kegiatan</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 mt-8 space-y-8">
        
        {/* 1. KARTU RINGKASAN (STATS) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Total Masuk */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-green-100">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-green-50 rounded-lg text-green-600"><Wallet size={20} /></div>
              <span className="text-sm font-medium text-gray-500">Total Donasi Uang</span>
            </div>
            <p className="text-2xl font-bold text-gray-800">Rp {stats.total_uang_masuk.toLocaleString('id-ID')}</p>
          </div>

          {/* Total Keluar */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-red-100">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-red-50 rounded-lg text-red-600"><TrendingDown size={20} /></div>
              <span className="text-sm font-medium text-gray-500">Total Pengeluaran</span>
            </div>
            <p className="text-2xl font-bold text-gray-800">Rp {stats.total_pengeluaran.toLocaleString('id-ID')}</p>
          </div>

          {/* Donasi Barang */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-blue-100">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-blue-50 rounded-lg text-blue-600"><Package size={20} /></div>
              <span className="text-sm font-medium text-gray-500">Donasi Barang</span>
            </div>
            <p className="text-2xl font-bold text-gray-800">{stats.total_barang_masuk} <span className="text-sm font-normal text-gray-500">Donatur</span></p>
          </div>
        </div>
        
        {/* Sisa Dana Banner */}
        <div className="bg-blue-600 text-white p-4 rounded-lg flex justify-between items-center shadow-md">
            <span className="font-medium">Sisa Dana Tersedia</span>
            <span className="text-xl font-bold">Rp {sisaDana.toLocaleString('id-ID')}</span>
        </div>

        {/* 2. TABEL DETAIL */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {/* Tabs */}
          <div className="flex border-b">
            <button 
              onClick={() => setActiveTab('pemasukan')}
              className={`flex-1 py-4 text-sm font-medium text-center transition ${activeTab === 'pemasukan' ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Riwayat Pemasukan
            </button>
            <button 
              onClick={() => setActiveTab('pengeluaran')}
              className={`flex-1 py-4 text-sm font-medium text-center transition ${activeTab === 'pengeluaran' ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Riwayat Pengeluaran
            </button>
          </div>

          {/* Content */}
          <div className="p-0">
            {activeTab === 'pemasukan' ? (
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 text-gray-500">
                  <tr>
                    <th className="p-4 font-medium">Donatur</th>
                    <th className="p-4 font-medium">Tanggal</th>
                    <th className="p-4 font-medium text-right">Jumlah</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {income.length > 0 ? income.map((item: any, idx: number) => (
                    <tr key={idx}>
                      <td className="p-4 text-gray-800">{item.anonim ? 'Hamba Allah' : item.nama_donatur}</td>
                      <td className="p-4 text-gray-500">{new Date(item.created_at).toLocaleDateString('id-ID')}</td>
                      <td className="p-4 text-right font-medium text-green-600">+ Rp {item.nominal.toLocaleString('id-ID')}</td>
                    </tr>
                  )) : (
                    <tr><td colSpan={3} className="p-8 text-center text-gray-400">Belum ada data pemasukan.</td></tr>
                  )}
                </tbody>
              </table>
            ) : (
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 text-gray-500">
                  <tr>
                    <th className="p-4 font-medium">Keterangan</th>
                    <th className="p-4 font-medium">Tanggal</th>
                    <th className="p-4 font-medium text-right">Jumlah</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {expenses.length > 0 ? expenses.map((item: any, idx: number) => (
                    <tr key={idx}>
                      <td className="p-4">
                        <p className="text-gray-800 font-medium">{item.deskripsi}</p>
                        {item.type === 'barang' && <p className="text-xs text-gray-500">{item.item_details}</p>}
                      </td>
                      <td className="p-4 text-gray-500">{new Date(item.tanggal).toLocaleDateString('id-ID')}</td>
                      <td className="p-4 text-right font-medium text-red-600">
                         {item.type === 'uang' ? `- Rp ${item.nominal.toLocaleString('id-ID')}` : 'Barang Keluar'}
                      </td>
                    </tr>
                  )) : (
                    <tr><td colSpan={3} className="p-8 text-center text-gray-400">Belum ada data pengeluaran.</td></tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>

      </div>
    </div>
  )
}