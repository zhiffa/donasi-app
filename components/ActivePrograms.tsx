// File: components/ActivePrograms.tsx

// 1. Impor komponen slider baru kamu
import ProgramSlider from '@/components/ProgramSlider'; 
import { AlertCircle } from 'lucide-react';

// Tipe data ini HARUS SAMA dengan respons API /api/kegiatan
interface PublicProgram {
  id_kegiatan: number;
  nama_program: string;
  deskripsi: string | null;
  url_poster: string | null;
  target_dana: number;
  terkumpul: number; // Ini didapat dari JOIN SUM
}

// --- Fungsi Fetch Data (di Server Component) ---
async function getActivePrograms(): Promise<PublicProgram[] | null> {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/kegiatan`, {
      cache: 'no-store' 
    });

    if (!res.ok) {
      throw new Error('Gagal mengambil data program');
    }
    
    const data = await res.json();
    return data;
  } catch (error) {
    console.error('[FETCH_PUBLIC_PROGRAMS_ERROR]', error);
    return null; 
  }
}

// --- Komponen Utama (Async Server Component) ---
export default async function ActivePrograms() {
  
  const programs = await getActivePrograms();

  // --- Tampilan Error ---
  if (!programs) {
    return (
      // --- PERUBAHAN BG: Menjadi putih ---
      <div className="bg-white py-20"> 
        <div className="container mx-auto max-w-lg p-8 bg-red-50 border border-red-200 rounded-lg text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-red-400" />
          <h2 className="mt-4 text-2xl font-bold text-red-700">Oops, terjadi kesalahan</h2>
          <p className="mt-2 text-red-600">Gagal mengambil data program</p>
        </div>
      </div>
    );
  }

  // --- Tampilan Jika Tidak Ada Program ---
  if (programs.length === 0) {
    return (
      // --- PERUBAHAN BG: Menjadi putih ---
      <div className="bg-white py-20">
        <div className="container mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Program Donasi</h2>
          <p className="text-gray-500 text-lg">
            Belum ada program donasi yang aktif saat ini.
          </p>
        </div>
      </div>
    );
  }

  // --- Tampilan Daftar Program (Slider) ---
  return (
    // --- PERUBAHAN BG: Menjadi putih ---
    <div className="bg-white py-20">
      <div className="container mx-auto px-4 md:px-6">
        <h2 className="mb-12 text-center text-4xl font-bold">
          Program Donasi Aktif
        </h2>
        
        {/* --- PERUBAHAN GRID MENJADI SLIDER --- */}
        {/* Hapus <div> grid lama dan panggil ProgramSlider */}
        <ProgramSlider programs={programs} />
        
      </div>
    </div>
  );
}

// --- Skeleton (UI Loading) ---
export function ActiveProgramsSkeleton() {
  return (
    // --- PERUBAHAN BG: Menjadi putih ---
    <div className="bg-white py-20">
      <div className="container mx-auto px-4 md:px-6">
        <h2 className="mb-12 text-center text-4xl font-bold">
          Program Donasi Aktif
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 animate-pulse">
          {[1, 2, 3].map((n) => (
            <div key={n} className="overflow-hidden rounded-lg bg-white shadow-lg">
              {/* Skeleton untuk gambar 4:5 */}
              <div className="w-full aspect-[4/5] bg-gray-200"></div> 
              <div className="p-6">
                <div className="h-6 w-3/4 rounded bg-gray-200 mb-3"></div>
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