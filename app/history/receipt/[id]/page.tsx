'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Loader2, Printer } from 'lucide-react'

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
}

export default function ReceiptPage({ params }: { params: { id: string } }) {
  const [data, setData] = useState<ReceiptData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(`/api/history/detail/${params.id}`);
        if (!res.ok) throw new Error('Not found');
        const result = await res.json();
        
        if (result.status !== 'Diterima') {
            alert('Tanda terima hanya tersedia untuk donasi yang sudah diterima.');
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
  }, [params.id]);

  if (loading) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin"/></div>;
  if (!data) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4 flex flex-col items-center">
      
      {/* Toolbar (Akan disembunyikan saat print) */}
      <div className="mb-6 flex gap-4 print-hidden">
        <button 
            onClick={handlePrint}
            className="flex items-center bg-blue-600 text-white px-6 py-2 rounded-full font-bold hover:bg-blue-700 shadow-lg transition"
        >
            <Printer className="mr-2 h-5 w-5" /> Cetak / Simpan PDF
        </button>
      </div>

      {/* --- KERTAS SURAT (ID: printable-area) --- */}
      {/* Saya menambahkan class 'text-sm' sebagai base font size, bisa diganti */}
      <div 
        id="printable-area"
        className="bg-white w-full max-w-[210mm] min-h-[297mm] p-[20mm] shadow-2xl text-gray-900 font-serif relative"
      >
        
        {/* KOP SURAT */}
        <div className="border-b-4 border-double border-gray-800 pb-6 mb-8 flex items-center justify-between">
            <div className="flex items-center gap-4">
                {/* Logo Placeholder */}
                <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center text-xs font-bold text-gray-500">
                    LOGO
                </div>
                <div>
                    <h1 className="text-3xl font-bold text-gray-800 uppercase tracking-wider">YAYASAN SHINE IN SMILES</h1>
                    <p className="text-sm text-gray-600">Jl. Kebaikan No. 123, Jakarta Pusat, Indonesia</p>
                    <p className="text-sm text-gray-600">Telp: (021) 123-4567 | Email: info@shineinsmiles.org</p>
                </div>
            </div>
        </div>

        {/* JUDUL */}
        <div className="text-center mb-10">
            <h2 className="text-2xl font-bold underline decoration-2 underline-offset-4">SURAT TANDA TERIMA DONASI</h2>
            <p className="text-gray-600 mt-2">Nomor: {data.id_donasi}/STTD/SIS/{new Date(data.created_at).getFullYear()}</p>
        </div>

        {/* ISI SURAT */}
        <div className="space-y-6 text-lg leading-relaxed content-text">
            <p>Yang bertanda tangan di bawah ini, pengurus Yayasan Shine in Smiles menerangkan bahwa:</p>

            <table className="w-full mb-8">
                <tbody>
                    <tr>
                        <td className="w-40 py-2 font-bold align-top">Nama Donatur</td>
                        <td className="py-2 align-top">: {data.nama_donatur}</td>
                    </tr>
                    <tr>
                        <td className="w-40 py-2 font-bold align-top">Kontak</td>
                        <td className="py-2 align-top">: {data.email_donatur} / {data.phone_donatur}</td>
                    </tr>
                </tbody>
            </table>

            <p>Telah memberikan donasi dengan rincian sebagai berikut:</p>

            <div className="border-2 border-gray-800 p-6 my-6 bg-gray-50 print:bg-white print:border-gray-800 donation-box">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <p className="text-sm text-gray-500">Program Tujuan</p>
                        <p className="font-bold text-xl">{data.nama_program}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-sm text-gray-500">Tanggal Diterima</p>
                        <p className="font-bold">{new Date(data.created_at).toLocaleDateString('id-ID', { dateStyle: 'full' })}</p>
                    </div>
                </div>
                
                <hr className="my-4 border-gray-300"/>

                <div className="flex justify-between items-center">
                    <span className="font-bold text-gray-700">JENIS DONASI: {data.jenis_donasi.toUpperCase()}</span>
                    <span className="text-3xl font-bold text-gray-900">
                        {data.jenis_donasi === 'Uang' 
                            ? `Rp ${Number(data.nominal).toLocaleString('id-ID')}`
                            : data.nama_barang}
                    </span>
                </div>
            </div>

            <p>
                Terima kasih atas kepercayaan dan kontribusi Bapak/Ibu/Saudara. 
                Semoga donasi ini menjadi amal jariyah dan membawa keberkahan bagi kita semua.
            </p>
        </div>

        {/* TANDA TANGAN */}
        <div className="mt-20 flex justify-end text-center break-inside-avoid signature-section">
            <div className="w-64">
                <p className="mb-20">Jakarta, {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                
                {/* Tempat Cap Yayasan */}
                <div className="relative">
                    {/* Simulasi Cap */}
                    <div className="absolute -top-16 left-10 w-32 h-32 border-4 border-blue-800 rounded-full opacity-20 flex items-center justify-center rotate-[-15deg] print:opacity-50">
                        <span className="text-xs font-bold text-blue-800 text-center">YAYASAN<br/>SHINE IN SMILES<br/>OFFICIAL</span>
                    </div>
                    
                    <p className="font-bold underline decoration-1 underline-offset-4">{data.nama_verifikator}</p>
                    <p>Verifikator / Pengurus</p>
                </div>
            </div>
        </div>

        {/* FOOTER */}
        <div className="absolute bottom-10 left-0 right-0 text-center text-sm text-gray-400 print:bottom-4">
            Surat ini dicetak secara otomatis oleh sistem Shine in Smiles.
        </div>

      </div>
      
      {/* --- CSS KHUSUS PRINT (DIPERBARUI UNTUK FONT & UKURAN) --- */}
      <style jsx global>{`
        @media print {
            /* 1. Sembunyikan semua elemen di halaman */
            body * {
                visibility: hidden;
            }
            
            /* 2. Tampilkan hanya area surat (#printable-area) dan isinya */
            #printable-area, #printable-area * {
                visibility: visible;
            }

            /* 3. Posisikan area surat di pojok kiri atas halaman cetak */
            #printable-area {
                position: absolute;
                left: 0;
                top: 0;
                width: 100%;
                margin: 0;
                /* PENGATURAN PADDING & FONT UNTUK CETAK */
                padding: 15mm !important; /* Sedikit kurangi padding agar lebih muat */
                background: white;
                box-shadow: none;
                
                /* --- MENGATUR UKURAN FONT --- */
                font-size: 12pt; /* Ukuran dasar font saat dicetak */
                line-height: 1.4; /* Jarak antar baris agar tidak terlalu renggang */
            }

            /* Penyesuaian elemen spesifik saat dicetak */
            #printable-area h1 {
                font-size: 22pt; /* Judul Yayasan */
            }
            #printable-area h2 {
                font-size: 18pt; /* Judul Surat */
            }
            #printable-area .content-text {
                font-size: 12pt; /* Isi surat */
            }
            #printable-area .donation-box {
                padding: 15px !important; /* Kecilkan padding box donasi */
                margin: 20px 0 !important;
            }
            #printable-area .signature-section {
                margin-top: 40px !important; /* Kurangi jarak tanda tangan */
            }

            /* 4. Atur ukuran kertas dan margin browser */
            @page {
                size: A4;
                margin: 0mm; /* Hilangkan margin default browser */
            }

            /* 5. Sembunyikan tombol toolbar */
            .print-hidden {
                display: none !important;
            }
        }
      `}</style>
    </div>
  )
}