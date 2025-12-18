'use client' 

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Loader2 } from 'lucide-react'

import MyDonationStatus from '@/components/MyDonationStatus'
import DonasiMasuk from '@/components/DonasiMasuk'
import PengeluaranDana from '@/components/PengeluaranDana'

export default function LiveReportPage({ params }: { params: { programId: string } }) {
  const router = useRouter();
  const { programId } = params;

  const [programName, setProgramName] = useState('');
  const [loading, setLoading] = useState(true);

  // Ambil Nama Program untuk Judul
  useEffect(() => {
    if (programId) {
      async function fetchProgramData() {
        try {
          const res = await fetch(`/api/kegiatan/${programId}`);
          if (!res.ok) {
            throw new Error('Program tidak ditemukan');
          }
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
        
        {/* Tombol Kembali */}
        <button
          onClick={() => router.push('/')}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-6 font-medium transition"
        >
          <ArrowLeft className="w-5 h-5 mr-2" /> Kembali ke Beranda
        </button>

        <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2">
          Laporan Real-Time
        </h1>
        <p className="text-xl text-blue-600 font-semibold mb-8">
          Program: {programName}
        </p>

        {/* --- BAGIAN 1: STATUS DONASI SAYA --- */}
        {/* Komponen ini otomatis mengecek apakah user login & punya donasi di sini */}
        <MyDonationStatus programId={programId} />

        {/* --- BAGIAN 2: LAPORAN PUBLIK --- */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
          
          {/* Daftar Donasi Masuk (Data Realtime) */}
          <DonasiMasuk programId={programId} />

          {/* Daftar Pengeluaran (Data dari Admin) */}
          <PengeluaranDana programId={programId} />

        </div>
        
        {/* --- BAGIAN 3: TOMBOL RIWAYAT --- */}
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