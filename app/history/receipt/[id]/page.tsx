'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image' 
import { Loader2, Printer, ChevronLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface ReceiptData {
  id_donasi: number;
  created_at: string;
  nama_donatur: string;
  email_donatur: string;
  phone_donatur: string;
  jenis_donasi: 'Uang' | 'Barang';
  nominal: number | null;
  nama_barang: string | null;
  deskripsi_barang: string | null; // Data deskripsi tambahan
  nama_program: string;
  nama_verifikator: string;
  status: string;
}

export default function ReceiptPage({ params }: { params: { id: string } }) {
  const [data, setData] = useState<ReceiptData | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(`/api/history/detail/${params.id}`);
        if (!res.ok) throw new Error('Not found');
        const result = await res.json();
        
        if (result.status !== 'Diterima') {
            alert('Tanda terima hanya tersedia untuk donasi yang sudah diterima.');
            router.push('/history');
            return;
        }
        setData(result);
      } catch (e) {
        alert('Gagal memuat data surat.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [params.id, router]);

  if (loading) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin text-blue-600"/></div>;
  if (!data) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-gray-100 md:p-8 flex flex-col items-center">
      
      {/* --- TOOLBAR --- */}
      <div className="w-full max-w-[210mm] mb-6 flex flex-col sm:flex-row justify-between items-center gap-4 px-4 py-4 md:px-0 print:hidden">
        <button 
          onClick={() => router.back()}
          className="flex items-center text-gray-600 hover:text-gray-900 font-medium transition"
        >
          <ChevronLeft className="mr-1 h-5 w-5" /> Kembali
        </button>

        <button 
            onClick={handlePrint}
            className="w-full sm:w-auto flex items-center justify-center bg-blue-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-blue-700 shadow-lg transition active:scale-95"
        >
            <Printer className="mr-2 h-5 w-5" /> Cetak / Simpan PDF
        </button>
      </div>

      {/* --- KERTAS SURAT (A4) --- */}
      <div 
        id="printable-area"
        className="bg-white w-full md:max-w-[210mm] min-h-screen md:min-h-[297mm] p-6 sm:p-10 md:p-[20mm] shadow-xl text-gray-900 font-serif relative overflow-hidden"
      >
        
        {/* KOP SURAT */}
        <div className="border-b-4 border-double border-gray-800 pb-6 mb-8 flex flex-col sm:flex-row items-center text-center sm:text-left gap-4 md:gap-6">
            <div className="relative w-20 h-20 md:w-24 md:h-24 flex-shrink-0">
                <Image src="/logo.png" alt="Logo" fill className="object-contain" priority />
            </div>
            <div className="flex-1">
                <h1 className="text-xl md:text-2xl font-bold text-gray-800 uppercase leading-tight">
                  YAYASAN ABHIMATA : SHINE IN SMILES
                </h1>
                <p className="text-xs md:text-sm text-gray-600">Jl Bintaro Jaya, Pondok Aren, Tangerang Selatan, Indonesia</p>
                <p className="text-xs md:text-sm text-gray-600">Telp: (021) 123-4567 | info@shineinsmiles.org</p>
            </div>
        </div>

        {/* JUDUL */}
        <div className="text-center mb-8">
            <h2 className="text-lg md:text-2xl font-bold underline">SURAT TANDA TERIMA DONASI</h2>
            <p className="text-xs md:text-sm text-gray-600 mt-2 font-sans">
              Nomor: {data.id_donasi}/STTD/SIS/{new Date(data.created_at).getFullYear()}
            </p>
        </div>

        {/* ISI SURAT */}
        <div className="space-y-6 text-sm md:text-lg leading-relaxed">
            <p>Menerangkan bahwa donatur di bawah ini:</p>

            <table className="w-full mb-4">
                <tbody>
                    <tr>
                        <td className="w-24 md:w-40 font-bold py-1">Nama</td>
                        <td>: {data.nama_donatur}</td>
                    </tr>
                    <tr>
                        <td className="font-bold py-1">Kontak</td>
                        <td>: {data.email_donatur} / {data.phone_donatur}</td>
                    </tr>
                </tbody>
            </table>

            <p>Telah menyerahkan donasi sebagai berikut:</p>

            <div className="border-2 border-gray-800 p-6 bg-gray-50 rounded-lg">
                <div className="flex flex-col sm:flex-row justify-between mb-4 border-b border-gray-300 pb-2">
                    <div>
                        <p className="text-xs text-gray-500 font-bold uppercase">Program</p>
                        <p className="font-bold text-blue-900">{data.nama_program}</p>
                    </div>
                    <div className="sm:text-right">
                        <p className="text-xs text-gray-500 font-bold uppercase">Tanggal Diterima</p>
                        <p className="font-bold">{new Date(data.created_at).toLocaleDateString('id-ID', { dateStyle: 'full' })}</p>
                    </div>
                </div>

                <div className="flex flex-col gap-1">
                    <span className="text-xs font-bold text-gray-600 uppercase">Rincian {data.jenis_donasi}:</span>
                    <span className="text-2xl md:text-4xl font-black text-gray-900">
                        {data.jenis_donasi === 'Uang' 
                            ? `Rp ${Number(data.nominal).toLocaleString('id-ID')}`
                            : data.nama_barang}
                    </span>
                    
                    {/* BAGIAN DESKRIPSI BARANG */}
                    {data.jenis_donasi === 'Barang' && data.deskripsi_barang && (
                      <div className="mt-3 pt-2 border-t border-gray-200">
                        <p className="text-xs font-bold text-gray-500 uppercase">Keterangan Barang:</p>
                        <p className="text-sm md:text-lg italic text-gray-700 leading-snug">
                          "{data.deskripsi_barang}"
                        </p>
                      </div>
                    )}
                </div>
            </div>

            <p className="italic">
                Terima kasih atas kontribusi Anda. Semoga menjadi berkah bagi kita semua.
            </p>
        </div>

        {/* TANDA TANGAN */}
        <div className="mt-20 flex justify-end text-center">
            <div className="w-64">
                <p className="mb-20">Jakarta, {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                <p className="font-bold underline">{data.nama_verifikator}</p>
                <p className="text-sm italic text-gray-500">Verifikator Resmi</p>
            </div>
        </div>

        <div className="absolute bottom-10 left-0 right-0 text-center text-[10px] text-gray-400 print:hidden">
            Dicetak otomatis oleh Sistem Shine in Smiles.
        </div>
      </div>
      
      <style jsx global>{`
        @media print {
            body * { visibility: hidden; }
            #printable-area, #printable-area * { visibility: visible; }
            #printable-area { 
              position: absolute; left: 0; top: 0; width: 210mm; 
              padding: 20mm !important; box-shadow: none;
            }
            @page { size: A4; margin: 0; }
        }
      `}</style>
    </div>
  )
}