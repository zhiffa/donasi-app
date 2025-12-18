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
      
      {/* --- TOOLBAR (RESPONSIF) --- */}
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

      {/* --- KERTAS SURAT --- */}
      <div 
        id="printable-area"
        className="bg-white w-full md:max-w-[210mm] min-h-screen md:min-h-[297mm] p-6 sm:p-10 md:p-[20mm] shadow-xl text-gray-900 font-serif relative overflow-hidden"
      >
        
        {/* KOP SURAT (DIPERBAIKI UNTUK MOBILE) */}
        <div className="border-b-4 border-double border-gray-800 pb-6 mb-8 flex flex-col sm:flex-row items-center text-center sm:text-left gap-4 md:gap-6">
            <div className="relative w-20 h-20 md:w-24 md:h-24 flex-shrink-0">
                <Image 
                    src="/logo.png" 
                    alt="Logo Yayasan" 
                    fill
                    className="object-contain"
                    priority 
                />
            </div>

            <div className="flex-1">
                <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-800 uppercase tracking-tight md:tracking-wider leading-tight">
                  YAYASAN ABHIMATA : SHINE IN SMILES
                </h1>
                <p className="text-xs md:text-sm text-gray-600 mt-1">Jl Bintaro Jaya, Pondok Aren, Tangerang Selatan, Indonesia</p>
                <p className="text-xs md:text-sm text-gray-600">Telp: (021) 123-4567 | Email: info@shineinsmiles.org</p>
            </div>
        </div>

        {/* JUDUL */}
        <div className="text-center mb-8 md:mb-10">
            <h2 className="text-lg md:text-2xl font-bold underline decoration-2 underline-offset-4">SURAT TANDA TERIMA DONASI</h2>
            <p className="text-xs md:text-sm text-gray-600 mt-2 font-sans">
              Nomor: {data.id_donasi}/STTD/SIS/{new Date(data.created_at).getFullYear()}
            </p>
        </div>

        {/* ISI SURAT */}
        <div className="space-y-4 md:space-y-6 text-sm md:text-lg leading-relaxed content-text">
            <p>Yang bertanda tangan di bawah ini, pengurus Yayasan Abhimata - Shine in Smiles menerangkan bahwa:</p>

            <div className="w-full overflow-x-auto">
              <table className="w-full mb-4">
                  <tbody>
                      <tr>
                          <td className="w-24 md:w-40 py-1 md:py-2 font-bold align-top">Donatur</td>
                          <td className="py-1 md:py-2 align-top">: {data.nama_donatur}</td>
                      </tr>
                      <tr>
                          <td className="w-24 md:w-40 py-1 md:py-2 font-bold align-top">Kontak</td>
                          <td className="py-1 md:py-2 align-top break-all">: {data.email_donatur} / {data.phone_donatur}</td>
                      </tr>
                  </tbody>
              </table>
            </div>

            <p>Telah memberikan donasi dengan rincian sebagai berikut:</p>

            <div className="border-2 border-gray-800 p-4 md:p-6 my-4 md:my-6 bg-gray-50 print:bg-white print:border-gray-800 donation-box rounded-lg md:rounded-none">
                <div className="flex flex-col sm:flex-row justify-between gap-4">
                    <div>
                        <p className="text-[10px] md:text-sm text-gray-500 uppercase font-sans font-bold">Program Tujuan</p>
                        <p className="font-bold text-base md:text-xl text-blue-900 uppercase">{data.nama_program}</p>
                    </div>
                    <div className="sm:text-right">
                        <p className="text-[10px] md:text-sm text-gray-500 uppercase font-sans font-bold">Tanggal Diterima</p>
                        <p className="font-bold text-sm md:text-lg italic">
                          {new Date(data.created_at).toLocaleDateString('id-ID', { dateStyle: 'full' })}
                        </p>
                    </div>
                </div>
                
                <hr className="my-4 border-gray-300"/>

                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                    <span className="font-bold text-xs md:text-sm text-gray-700 bg-gray-200 px-2 py-1 rounded">
                      JENIS: {data.jenis_donasi.toUpperCase()}
                    </span>
                    <span className="text-2xl md:text-4xl font-black text-gray-900">
                        {data.jenis_donasi === 'Uang' 
                            ? `Rp ${Number(data.nominal).toLocaleString('id-ID')}`
                            : data.nama_barang}
                    </span>
                </div>
            </div>

            <p className="italic text-sm md:text-lg">
                Terima kasih atas kepercayaan dan kontribusi Bapak/Ibu/Saudara. 
                Semoga donasi ini menjadi amal jariyah dan membawa keberkahan bagi kita semua.
            </p>
        </div>

        {/* TANDA TANGAN */}
        <div className="mt-12 md:mt-20 flex justify-end text-center signature-section">
            <div className="w-48 md:w-64">
                <p className="mb-12 md:mb-20 text-sm md:text-base">
                  Jakarta, {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
                
                <div className="relative">
                    {/* Simulasi Cap (Hanya muncul di print atau layar lebar agar tidak menutupi teks di mobile) */}
                    <div className="absolute -top-10 md:-top-16 left-4 md:left-10 w-24 h-24 md:w-32 md:h-32 border-4 border-blue-800 rounded-full opacity-10 flex items-center justify-center rotate-[-15deg] print:opacity-40">
                        <span className="text-[8px] md:text-xs font-bold text-blue-800 text-center uppercase">
                          Official<br/>Shine in Smiles
                        </span>
                    </div>
                    
                    <p className="font-bold underline text-sm md:text-lg">{data.nama_verifikator}</p>
                    <p className="text-xs md:text-sm">Verifikator / Pengurus</p>
                </div>
            </div>
        </div>

        {/* FOOTER */}
        <div className="mt-12 md:absolute md:bottom-10 left-0 right-0 text-center text-[10px] md:text-sm text-gray-400 print:bottom-4">
            Surat ini dicetak secara otomatis oleh sistem Abhimata - Shine in Smiles.
        </div>

      </div>
      
      {/* --- CSS KHUSUS PRINT & OVERRIDE --- */}
      <style jsx global>{`
        @media print {
            body * {
                visibility: hidden;
            }
            #printable-area, #printable-area * {
                visibility: visible;
            }
            #printable-area {
                position: absolute;
                left: 0;
                top: 0;
                width: 210mm; /* Paksa lebar A4 saat print */
                min-height: 297mm;
                padding: 15mm !important; 
                background: white;
                box-shadow: none;
                font-size: 12pt;
                line-height: 1.5;
            }
            @page {
                size: A4;
                margin: 0;
            }
            .print-hidden {
                display: none !important;
            }
        }
      `}</style>
    </div>
  )
}