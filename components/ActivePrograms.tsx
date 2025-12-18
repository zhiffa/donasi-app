import ProgramSlider from '@/components/ProgramSlider'; 
import { AlertCircle } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient'; 

export default async function ActivePrograms() {
  
  // 1. Ambil data kegiatan Aktif dan JOIN tabel donasi
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

  if (error) {
    console.error('[FETCH_ERROR]', error);
    return (
      <div className="bg-white py-20 text-center">
        <AlertCircle className="mx-auto h-12 w-12 text-red-400" />
        <h2 className="mt-4 text-2xl font-bold text-red-700">Oops, terjadi kesalahan</h2>
        <p className="text-gray-500 text-sm">Gagal memuat data dari database.</p>
      </div>
    );
  }

  // 2. Mapping data untuk menghitung total donasi 'Diterima'
  const mappedPrograms = programs?.map((p: any) => {
    const totalTerkumpul = p.donasi
      ? p.donasi
          .filter((d: any) => String(d.status).trim() === 'Diterima') 
          .reduce((sum: number, d: any) => sum + (parseFloat(d.nominal) || 0), 0)
      : 0;

    return {
      id: p.id_kegiatan, // Pastikan prop 'id' dikirim (bukan id_kegiatan)
      title: p.nama_program,
      description: p.deskripsi,
      imageUrl: p.url_poster,
      target: parseFloat(p.target_dana) || 0, // Konversi ke angka desimal
      collected: totalTerkumpul 
    };
  }) || [];

  if (mappedPrograms.length === 0) {
    return (
      <div className="bg-white py-20 text-center">
        <h2 className="text-3xl font-bold mb-4 text-gray-800">Program Donasi</h2>
        <p className="text-gray-500">Belum ada program aktif saat ini.</p>
      </div>
    );
  }

  return (
    <div className="bg-white py-20">
      <div className="container mx-auto px-4 md:px-6">
        <h2 className="mb-12 text-center text-4xl font-bold text-gray-900">
          Program Donasi Aktif
        </h2>
        <ProgramSlider programs={mappedPrograms as any} />
      </div>
    </div>
  );
}

export function ActiveProgramsSkeleton() {
  return (
    <div className="bg-white py-20">
      <div className="container mx-auto px-4 md:px-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 animate-pulse">
          {[1, 2, 3].map((n) => (
            <div key={n} className="rounded-3xl bg-gray-100 aspect-square"></div>
          ))}
        </div>
      </div>
    </div>
  );
}