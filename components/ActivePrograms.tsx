// File: components/ActivePrograms.tsx
import ProgramSlider from '@/components/ProgramSlider'; 
import { AlertCircle } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient'; 

export default async function ActivePrograms() {
  
  // 1. Ambil data kegiatan yang statusnya 'Aktif'
  // Melakukan JOIN dengan tabel donasi untuk mengambil nominal dan status secara real-time
  const { data: programs, error } = await supabase
    .from('kegiatan')
    .select(`
      *,
      donasi (
        nominal,
        status
      )
    `)
    .eq('status', 'Aktif')
    .order('created_at', { ascending: false });

  // --- Handle Error Koneksi/Query ---
  if (error) {
    console.error('[FETCH_ERROR]', error);
    return (
      <div className="bg-white py-20 text-center">
        <AlertCircle className="mx-auto h-12 w-12 text-red-400" />
        <h2 className="mt-4 text-2xl font-bold text-red-700">Oops, terjadi kesalahan</h2>
        <p className="text-gray-500">Gagal mengambil data program dari database.</p>
      </div>
    );
  }

  // 2. Mapping data untuk menghitung total donasi dengan status 'Diterima'
  const mappedPrograms = programs?.map((p: any) => {
    const totalTerkumpul = p.donasi
      ? p.donasi
          .filter((d: any) => d.status === 'Diterima') // Filter donasi yang sudah diverifikasi (Diterima)
          .reduce((sum: number, d: any) => sum + (Number(d.nominal) || 0), 0)
      : 0;

    return {
      id_kegiatan: p.id_kegiatan,
      nama_program: p.nama_program,
      deskripsi: p.deskripsi,
      url_poster: p.url_poster,
      target: Number(p.target_dana) || 0, // Mapping ke 'target' untuk ProgramCard
      collected: totalTerkumpul           // Mapping ke 'collected' untuk ProgramCard
    };
  }) || [];

  // --- Tampilan Jika Tidak Ada Program Aktif ---
  if (mappedPrograms.length === 0) {
    return (
      <div className="bg-white py-20 text-center">
        <h2 className="text-3xl font-bold mb-4 text-gray-800">Program Donasi</h2>
        <p className="text-gray-500 text-lg">
          Belum ada program donasi yang aktif saat ini.
        </p>
      </div>
    );
  }

  // --- Tampilan Utama Slider ---
  return (
    <div className="bg-white py-20">
      <div className="container mx-auto px-4 md:px-6">
        <h2 className="mb-12 text-center text-4xl font-bold text-gray-900">
          Program Donasi Aktif
        </h2>
        
        {/* Mengirim data yang sudah di-mapping ke ProgramSlider */}
        <ProgramSlider programs={mappedPrograms as any} />
        
      </div>
    </div>
  );
}

// --- Skeleton (UI Loading) - DITAMBAHKAN UNTUK MEMPERBAIKI ERROR BUILD VERCEL ---
export function ActiveProgramsSkeleton() {
  return (
    <div className="bg-white py-20">
      <div className="container mx-auto px-4 md:px-6">
        <h2 className="mb-12 text-center text-4xl font-bold text-gray-200">
          Program Donasi Aktif
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 animate-pulse">
          {[1, 2, 3].map((n) => (
            <div key={n} className="overflow-hidden rounded-3xl bg-white shadow-lg border border-gray-100">
              <div className="w-full aspect-square bg-gray-200"></div> 
              <div className="p-6">
                <div className="h-6 w-3/4 rounded bg-gray-200 mb-4"></div>
                <div className="h-4 w-full rounded bg-gray-200 mb-2"></div>
                <div className="h-4 w-5/6 rounded bg-gray-200 mb-6"></div>
                <div className="h-10 w-full rounded-full bg-gray-200"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}