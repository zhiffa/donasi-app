'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Loader2, CheckCircle, XCircle, Clock, FileText } from 'lucide-react'

// Impor komponen Live Reports yang sudah kita buat
import DonasiMasuk from '@/components/DonasiMasuk'
import PengeluaranDana from '@/components/PengeluaranDana'

interface DonationDetail {
  id_donasi: number;
  id_kegiatan: number;
  nama_program: string;
  created_at: string;
  jenis_donasi: 'Uang' | 'Barang';
  nominal: number | null;
  nama_barang: string | null;
  deskripsi_barang: string | null;
  status: string;
  rejection_reason: string | null; // Alasan penolakan
  metode_pengiriman: string | null;
}

export default function DonationDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [detail, setDetail] = useState<DonationDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        const res = await fetch(`/api/history/detail/${params.id}`);
        if (!res.ok) throw new Error('Gagal memuat detail');
        const data = await res.json();
        setDetail(data);
      } catch (err) {
        console.error(err);
        alert('Gagal memuat data donasi');
        router.push('/history');
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
  }, [params.id, router]);

  if (loading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin text-gray-400"/></div>;
  if (!detail) return null;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="container mx-auto max-w-5xl">
        
        {/* Tombol Kembali */}
        <button onClick={() => router.back()} className="flex items-center text-gray-600 hover:text-gray-900 mb-6 font-medium">
          <ArrowLeft className="w-5 h-5 mr-2" /> Kembali ke Riwayat
        </button>

        <h1 className="text-3xl font-bold text-gray-900 mb-6">Detail Donasi #{detail.id_donasi}</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* KOLOM KIRI: STATUS DONASI SAYA */}
            <div className="lg:col-span-1 space-y-6">
                
                {/* Kartu Status Utama */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <div className="text-center mb-6">
                        {detail.status === 'Diterima' && <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-3" />}
                        {detail.status === 'Ditolak' && <XCircle className="w-16 h-16 text-red-500 mx-auto mb-3" />}
                        {detail.status === 'Pending' && <Clock className="w-16 h-16 text-yellow-500 mx-auto mb-3" />}
                        
                        <h2 className="text-xl font-bold text-gray-800 capitalize">{detail.status}</h2>
                        <p className="text-sm text-gray-500 mt-1">{formatDate(detail.created_at)}</p>
                    </div>

                    {/* Detail Item */}
                    <div className="space-y-3 text-sm border-t pt-4">
                        <div className="flex justify-between">
                            <span className="text-gray-500">Program</span>
                            <span className="font-medium text-right w-1/2">{detail.nama_program}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-500">Jenis</span>
                            <span className="font-medium capitalize">{detail.jenis_donasi}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-500">Jumlah/Barang</span>
                            <span className="font-bold text-blue-600 text-right">
                                {detail.jenis_donasi === 'Uang' 
                                    ? `Rp ${Number(detail.nominal).toLocaleString('id-ID')}` 
                                    : detail.nama_barang}
                            </span>
                        </div>
                        {detail.deskripsi_barang && (
                             <div className="pt-2">
                                <span className="text-gray-500 block mb-1">Detail Barang:</span>
                                <p className="bg-gray-50 p-2 rounded text-gray-700">{detail.deskripsi_barang}</p>
                             </div>
                        )}
                    </div>

                    {/* LOGIKA KHUSUS: ALASAN DITOLAK */}
                    {detail.status === 'Ditolak' && (
                        <div className="mt-6 bg-red-50 border border-red-200 p-4 rounded-lg">
                            <h3 className="font-bold text-red-800 text-sm mb-1">Alasan Penolakan:</h3>
                            <p className="text-red-700 text-sm">
                                {detail.rejection_reason || 'Mohon maaf, donasi tidak dapat kami terima saat ini.'}
                            </p>
                        </div>
                    )}

                    {/* LOGIKA KHUSUS: TOMBOL SURAT (Hanya jika Diterima) */}
                    {detail.status === 'Diterima' && (
                        <div className="mt-6">
                            <Link 
                                href={`/history/receipt/${detail.id_donasi}`}
                                target="_blank"
                                className="flex items-center justify-center w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 transition shadow-lg shadow-blue-200"
                            >
                                <FileText className="mr-2 h-5 w-5" />
                                Lihat Tanda Terima Resmi
                            </Link>
                            <p className="text-xs text-center text-gray-500 mt-2">
                                Dokumen resmi yayasan dengan cap digital.
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* KOLOM KANAN: LIVE REPORTS (Menggunakan Komponen yang sudah ada) */}
            <div className="lg:col-span-2">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
                    <h2 className="text-xl font-bold text-gray-800 mb-4">Transparansi Program</h2>
                    <p className="text-gray-600 mb-6">
                        Berikut adalah laporan terkini donasi masuk dan penggunaan dana untuk program <strong>{detail.nama_program}</strong> secara keseluruhan.
                    </p>

                    <div className="grid grid-cols-1 gap-8">
                         {/* Reuse komponen DonasiMasuk & PengeluaranDana */}
                         {/* Kita pass id_kegiatan sebagai string */}
                         <DonasiMasuk programId={detail.id_kegiatan.toString()} />
                         <PengeluaranDana programId={detail.id_kegiatan.toString()} />
                    </div>
                </div>
            </div>

        </div>
      </div>
    </div>
  )
}